const mongoose = require('mongoose');

/**
 * A CodeChunk represents one slice of a source file, small enough to be
 * used as context for the LLM. Repositories are broken into many chunks
 * so that only the most relevant ones are sent to Gemini per question,
 * keeping prompts small and answers focused.
 */
const codeChunkSchema = new mongoose.Schema(
  {
    repository: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      default: '',
    },
    chunkIndex: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
    // Lowercased tokens used for lightweight keyword search (poor-man's retrieval,
    // avoids needing a vector DB / embeddings API for this project).
    keywords: {
      type: [String],
      default: [],
      index: true,
    },
    charCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

codeChunkSchema.index({ repository: 1, filePath: 1, chunkIndex: 1 });

module.exports = mongoose.model('CodeChunk', codeChunkSchema);
