const asyncHandler = require('express-async-handler');
const Repository = require('../models/Repository');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/AppError');
const { generateContent } = require('../services/geminiService');
const { buildRepositoryContext } = require('../services/retrievalService');
const { summarizeFileTree } = require('../utils/fileTreeSummary');
const {
  buildChatPrompt,
  buildReadmePrompt,
  buildApiDocsPrompt,
  buildBugFinderPrompt,
} = require('../services/promptTemplates');

/** Resolves the target repository id from either the route param or the body. */
function resolveRepoId(req) {
  return req.params.id || req.body.repoId;
}

async function loadOwnedRepository(userId, repoId) {
  if (!repoId) {
    throw new AppError('repoId is required', 400);
  }
  const repository = await Repository.findOne({ _id: repoId, owner: userId });
  if (!repository) {
    throw new AppError('Repository not found', 404);
  }
  if (repository.status !== 'ready') {
    throw new AppError(`Repository is not ready yet (status: ${repository.status})`, 409);
  }
  return repository;
}

// @desc    Ask a repository-aware question
// @route   POST /api/ai/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const repository = await loadOwnedRepository(req.user._id, resolveRepoId(req));

  const { context, sourcesUsed } = await buildRepositoryContext(repository._id, question);
  const prompt = buildChatPrompt({ repoName: repository.name, context, question, sourcesUsed });

  const answer = await generateContent(prompt);

  const conversation = await Conversation.create({
    userId: req.user._id,
    repoId: repository._id,
    question,
    answer,
    mode: 'chat',
    sourcesUsed,
  });

  res.status(200).json({ success: true, data: { conversation } });
});

// @desc    Generate a full README.md for a repository
// @route   POST /api/ai/generate-readme  (also aliased at /api/repositories/:id/generate-readme)
// @access  Private
const generateReadme = asyncHandler(async (req, res) => {
  const repository = await loadOwnedRepository(req.user._id, resolveRepoId(req));

  const { context } = await buildRepositoryContext(
    repository._id,
    'project overview, purpose, features, tech stack, setup, folder structure, api routes',
    20
  );
  const fileTreeSummary = summarizeFileTree(repository.fileTree);

  const prompt = buildReadmePrompt({ repoName: repository.name, context, fileTreeSummary });
  const markdown = await generateContent(prompt, { maxOutputTokens: 6000 });

  repository.generatedReadme = markdown;
  await repository.save();

  await Conversation.create({
    userId: req.user._id,
    repoId: repository._id,
    question: 'Generate a README for this repository',
    answer: markdown,
    mode: 'readme',
  });

  res.status(200).json({ success: true, data: { markdown } });
});

// @desc    Generate API documentation from Express routes found in the repository
// @route   POST /api/ai/generate-docs
// @access  Private
const generateDocs = asyncHandler(async (req, res) => {
  const repository = await loadOwnedRepository(req.user._id, resolveRepoId(req));

  const { context } = await buildRepositoryContext(
    repository._id,
    'express router route app.get app.post app.put app.delete endpoint controller',
    20
  );

  const prompt = buildApiDocsPrompt({ repoName: repository.name, context });
  const markdown = await generateContent(prompt, { maxOutputTokens: 6000 });

  await Conversation.create({
    userId: req.user._id,
    repoId: repository._id,
    question: 'Generate API documentation for this repository',
    answer: markdown,
    mode: 'docs',
  });

  res.status(200).json({ success: true, data: { markdown } });
});

// @desc    Analyze the repository for bugs, dead code, and security issues
// @route   POST /api/ai/find-bugs
// @access  Private
const findBugs = asyncHandler(async (req, res) => {
  const repository = await loadOwnedRepository(req.user._id, resolveRepoId(req));

  const { context } = await buildRepositoryContext(
    repository._id,
    'error handling validation security try catch duplicate function large file todo fixme',
    20
  );

  const prompt = buildBugFinderPrompt({ repoName: repository.name, context });
  const markdown = await generateContent(prompt, { maxOutputTokens: 6000 });

  await Conversation.create({
    userId: req.user._id,
    repoId: repository._id,
    question: 'Find bugs and security issues in this repository',
    answer: markdown,
    mode: 'bugs',
  });

  res.status(200).json({ success: true, data: { markdown } });
});

module.exports = { chat, generateReadme, generateDocs, findBugs, resolveRepoId, loadOwnedRepository };
