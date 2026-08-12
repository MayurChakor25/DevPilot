const asyncHandler = require('express-async-handler');
const Repository = require('../models/Repository');
const AppError = require('../utils/AppError');
const { cloneGithubRepository, deriveRepoName } = require('../services/gitService');
const { extractZipSafely, safeUnlink } = require('../services/zipService');
const { ingestRepository, deleteRepositoryCompletely } = require('../services/repositoryService');

// @desc    Import a public GitHub repository by URL
// @route   POST /api/repositories/import-github
// @access  Private
const importFromGithub = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const { repoName, storagePath } = await cloneGithubRepository(url);

  let repository = await Repository.create({
    owner: req.user._id,
    name: repoName,
    source: 'github',
    sourceUrl: url,
    storagePath,
    status: 'pending',
  });

  repository = await ingestRepository(repository);

  res.status(201).json({
    success: true,
    message: 'Repository imported and processed successfully',
    data: { repository },
  });
});

// @desc    Import a repository from an uploaded ZIP file
// @route   POST /api/repositories/upload
// @access  Private
const uploadRepository = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No ZIP file uploaded', 400);
  }

  const extractedPath = await extractZipSafely(req.file.path);
  await safeUnlink(req.file.path);

  const repoName =
    (req.body.name && req.body.name.trim()) ||
    req.file.originalname.replace(/\.zip$/i, '') ||
    'uploaded-repository';

  let repository = await Repository.create({
    owner: req.user._id,
    name: repoName,
    source: 'upload',
    sourceUrl: '',
    storagePath: extractedPath,
    status: 'pending',
  });

  repository = await ingestRepository(repository);

  res.status(201).json({
    success: true,
    message: 'Repository uploaded and processed successfully',
    data: { repository },
  });
});

// @desc    List all repositories owned by the current user
// @route   GET /api/repositories
// @access  Private
const listRepositories = asyncHandler(async (req, res) => {
  const repositories = await Repository.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .select('-fileTree');

  res.status(200).json({ success: true, data: { repositories } });
});

// @desc    Get a single repository (including file tree)
// @route   GET /api/repositories/:id
// @access  Private
const getRepository = asyncHandler(async (req, res) => {
  const repository = await Repository.findOne({ _id: req.params.id, owner: req.user._id });
  if (!repository) {
    throw new AppError('Repository not found', 404);
  }
  res.status(200).json({ success: true, data: { repository } });
});

// @desc    Delete a repository and all associated data
// @route   DELETE /api/repositories/:id
// @access  Private
const deleteRepository = asyncHandler(async (req, res) => {
  const repository = await Repository.findOne({ _id: req.params.id, owner: req.user._id });
  if (!repository) {
    throw new AppError('Repository not found', 404);
  }

  await deleteRepositoryCompletely(repository);

  res.status(200).json({ success: true, message: 'Repository deleted successfully' });
});

module.exports = {
  importFromGithub,
  uploadRepository,
  listRepositories,
  getRepository,
  deleteRepository,
};
