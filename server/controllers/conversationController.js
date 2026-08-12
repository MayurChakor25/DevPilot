const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Repository = require('../models/Repository');
const AppError = require('../utils/AppError');

// @desc    Get conversation history for a repository (owned by current user)
// @route   GET /api/conversations/:repoId
// @access  Private
const getConversationsForRepo = asyncHandler(async (req, res) => {
  const { repoId } = req.params;

  const repository = await Repository.findOne({ _id: repoId, owner: req.user._id });
  if (!repository) {
    throw new AppError('Repository not found', 404);
  }

  const conversations = await Conversation.find({ repoId, userId: req.user._id }).sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: { conversations } });
});

module.exports = { getConversationsForRepo };
