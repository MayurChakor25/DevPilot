const fs = require('fs');
const Repository = require('../models/Repository');
const CodeChunk = require('../models/CodeChunk');
const Conversation = require('../models/Conversation');
const { processRepository } = require('./codeProcessingService');

/**
 * Runs the full ingestion pipeline for a repository that has already been
 * cloned/extracted to disk: scans + chunks its files, then persists the
 * resulting file tree and stats. Marks the repository as failed (with an
 * error message) if anything goes wrong, instead of leaving it stuck.
 */
async function ingestRepository(repositoryDoc) {
  repositoryDoc.status = 'processing';
  await repositoryDoc.save();

  try {
    const { fileTree, stats } = await processRepository(repositoryDoc._id, repositoryDoc.storagePath);
    repositoryDoc.fileTree = fileTree;
    repositoryDoc.stats = stats;
    repositoryDoc.status = 'ready';
    await repositoryDoc.save();
  } catch (err) {
    repositoryDoc.status = 'failed';
    repositoryDoc.errorMessage = err.message;
    await repositoryDoc.save();
    throw err;
  }

  return repositoryDoc;
}

/**
 * Deletes a repository and all data associated with it: on-disk files,
 * code chunks, and conversation history.
 */
async function deleteRepositoryCompletely(repositoryDoc) {
  await CodeChunk.deleteMany({ repository: repositoryDoc._id });
  await Conversation.deleteMany({ repoId: repositoryDoc._id });

  if (repositoryDoc.storagePath && fs.existsSync(repositoryDoc.storagePath)) {
    try {
      fs.rmSync(repositoryDoc.storagePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (err) {
      // Non-fatal: prefer removing the DB records over blocking deletion on a
      // locked file handle (can happen transiently on Windows).
      // eslint-disable-next-line no-console
      console.warn(`[repositoryService] Could not remove ${repositoryDoc.storagePath}: ${err.message}`);
    }
  }

  await Repository.findByIdAndDelete(repositoryDoc._id);
}

module.exports = { ingestRepository, deleteRepositoryCompletely };
