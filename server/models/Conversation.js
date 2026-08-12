const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['chat', 'readme', 'docs', 'bugs'],
      default: 'chat',
    },
    sourcesUsed: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

conversationSchema.index({ repoId: 1, createdAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
