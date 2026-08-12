const fs = require('fs');
const path = require('path');
const {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  BINARY_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REPO,
  CHUNK_SIZE_CHARS,
  CHUNK_OVERLAP_CHARS,
} = require('../utils/fileRules');
const CodeChunk = require('../models/CodeChunk');

function isIgnoredFile(fileName) {
  return IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

/**
 * Recursively walks a directory, returning a flat list describing every
 * file and directory found (used to build the repository's file tree),
 * while skipping ignored directories/binaries along the way.
 */
function scanDirectory(rootDir) {
  const results = [];
  let fileCount = 0;

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      if (fileCount >= MAX_FILES_PER_REPO) return;

      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name) || entry.name.startsWith('.')) {
          if (entry.name !== '.' && entry.name !== '..' && !['.', '..'].includes(entry.name)) {
            // Still allow hidden files like .env.example to show, but skip hidden dirs like .git handled above.
          }
          if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        }
        results.push({ path: relativePath, type: 'directory', size: 0, extension: '' });
        walk(absolutePath);
      } else if (entry.isFile()) {
        if (isIgnoredFile(entry.name)) continue;
        let stats;
        try {
          stats = fs.statSync(absolutePath);
        } catch (err) {
          continue;
        }
        const extension = path.extname(entry.name).toLowerCase();
        results.push({ path: relativePath, type: 'file', size: stats.size, extension });
        fileCount += 1;
      }
    }
  }

  walk(rootDir);
  return results;
}

function isProcessableFile(fileNode) {
  if (fileNode.type !== 'file') return false;
  if (BINARY_EXTENSIONS.has(fileNode.extension)) return false;
  if (!SUPPORTED_EXTENSIONS.has(fileNode.extension)) return false;
  if (fileNode.size > MAX_FILE_SIZE_BYTES) return false;
  return true;
}

/**
 * Splits file content into overlapping chunks so each chunk stays under
 * the character budget used when building LLM context, while overlap
 * preserves continuity between chunks (e.g. a function split across two).
 */
function chunkText(text) {
  if (text.length <= CHUNK_SIZE_CHARS) return [text];

  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP_CHARS;
  }
  return chunks;
}

function extractKeywords(filePath, content) {
  const base = `${filePath} ${content}`.toLowerCase();
  const tokens = base.match(/[a-z0-9_]{3,}/g) || [];
  return Array.from(new Set(tokens)).slice(0, 300);
}

/**
 * Full processing pipeline for an imported repository:
 * 1. Recursively scans the extracted/cloned directory.
 * 2. Reads and chunks every supported text/code file (skipping binaries,
 *    ignored directories, and oversized files).
 * 3. Persists chunks to MongoDB for later keyword-based retrieval.
 *
 * Returns the file tree + aggregate stats used to update the Repository doc.
 */
async function processRepository(repositoryId, rootDir) {
  const fileTree = scanDirectory(rootDir);
  const processableFiles = fileTree.filter(isProcessableFile);

  const stats = {
    totalFiles: fileTree.filter((f) => f.type === 'file').length,
    processedFiles: 0,
    totalChunks: 0,
    totalSizeBytes: 0,
    skippedFiles: 0,
  };

  stats.skippedFiles = stats.totalFiles - processableFiles.length;

  // Clear any previous chunks for idempotent re-processing.
  await CodeChunk.deleteMany({ repository: repositoryId });

  const chunkDocs = [];

  for (const fileNode of processableFiles) {
    const absolutePath = path.join(rootDir, fileNode.path);
    let content;
    try {
      content = fs.readFileSync(absolutePath, 'utf8');
    } catch (err) {
      continue;
    }

    // Skip files that appear to be binary despite the extension check
    // (heuristic: presence of the NUL byte).
    if (content.includes('\u0000')) {
      stats.skippedFiles += 1;
      continue;
    }

    const pieces = chunkText(content);
    pieces.forEach((piece, index) => {
      chunkDocs.push({
        repository: repositoryId,
        filePath: fileNode.path,
        extension: fileNode.extension,
        chunkIndex: index,
        content: piece,
        keywords: extractKeywords(fileNode.path, piece),
        charCount: piece.length,
      });
    });

    stats.processedFiles += 1;
    stats.totalSizeBytes += fileNode.size;
    stats.totalChunks += pieces.length;
  }

  if (chunkDocs.length > 0) {
    // insertMany in batches to avoid oversized single operations on huge repos.
    const BATCH_SIZE = 500;
    for (let i = 0; i < chunkDocs.length; i += BATCH_SIZE) {
      await CodeChunk.insertMany(chunkDocs.slice(i, i + BATCH_SIZE), { ordered: false });
    }
  }

  return { fileTree, stats };
}

module.exports = {
  scanDirectory,
  isProcessableFile,
  chunkText,
  extractKeywords,
  processRepository,
};
