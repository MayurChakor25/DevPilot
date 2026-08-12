const mongoose = require('mongoose');

const fileNodeSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    type: { type: String, enum: ['file', 'directory'], required: true },
    size: { type: Number, default: 0 },
    extension: { type: String, default: '' },
  },
  { _id: false }
);

const repositorySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['github', 'upload'],
      required: true,
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    storagePath: {
      type: String,
      required: true,
    },
    fileTree: {
      type: [fileNodeSchema],
      default: [],
    },
    stats: {
      totalFiles: { type: Number, default: 0 },
      processedFiles: { type: Number, default: 0 },
      totalChunks: { type: Number, default: 0 },
      totalSizeBytes: { type: Number, default: 0 },
      skippedFiles: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    generatedReadme: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

repositorySchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Repository', repositorySchema);
