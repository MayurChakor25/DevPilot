const CodeChunk = require('../models/CodeChunk');

const MAX_CONTEXT_CHUNKS = 12;
const MAX_CONTEXT_CHARS = 24000;

function tokenize(text) {
  return Array.from(new Set((text.toLowerCase().match(/[a-z0-9_]{3,}/g) || [])));
}

/**
 * Lightweight, dependency-free retrieval: scores every chunk of a repository
 * by keyword overlap with the question (TF-style scoring using MongoDB's
 * `keywords` index), then returns the top-N highest scoring chunks.
 *
 * This avoids requiring an embeddings API while still giving the LLM
 * focused, relevant context instead of the entire repository.
 */
async function retrieveRelevantChunks(repositoryId, question, limit = MAX_CONTEXT_CHUNKS) {
  const queryTokens = tokenize(question);

  if (queryTokens.length === 0) {
    return CodeChunk.find({ repository: repositoryId }).limit(limit).lean();
  }

  const candidates = await CodeChunk.find({
    repository: repositoryId,
    keywords: { $in: queryTokens },
  })
    .limit(400)
    .lean();

  if (candidates.length === 0) {
    // Fall back to any chunks so the assistant still has *some* context.
    return CodeChunk.find({ repository: repositoryId }).limit(limit).lean();
  }

  const queryTokenSet = new Set(queryTokens);
  const scored = candidates.map((chunk) => {
    const overlap = chunk.keywords.filter((kw) => queryTokenSet.has(kw)).length;
    // Slightly favor README / config / entrypoint files for general questions.
    const pathBoost = /readme|package\.json|app\.js|index\.(js|ts)|main\.(js|ts)/i.test(chunk.filePath) ? 1 : 0;
    return { chunk, score: overlap + pathBoost };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, limit).map((s) => s.chunk);
  return top;
}

/**
 * Concatenates retrieved chunks into a single context string, respecting a
 * total character budget so the prompt sent to Gemini stays a reasonable size.
 */
function buildContextFromChunks(chunks) {
  let budget = MAX_CONTEXT_CHARS;
  const parts = [];
  const sourcesUsed = [];

  for (const chunk of chunks) {
    if (budget <= 0) break;
    const header = `\n--- File: ${chunk.filePath} (chunk ${chunk.chunkIndex}) ---\n`;
    const snippet = chunk.content.slice(0, Math.max(0, budget - header.length));
    parts.push(header + snippet);
    budget -= header.length + snippet.length;
    if (!sourcesUsed.includes(chunk.filePath)) sourcesUsed.push(chunk.filePath);
  }

  return { context: parts.join('\n'), sourcesUsed };
}

async function buildRepositoryContext(repositoryId, question, limit = MAX_CONTEXT_CHUNKS) {
  const chunks = await retrieveRelevantChunks(repositoryId, question, limit);
  return buildContextFromChunks(chunks);
}

module.exports = {
  retrieveRelevantChunks,
  buildContextFromChunks,
  buildRepositoryContext,
  MAX_CONTEXT_CHUNKS,
};
