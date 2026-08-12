const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const AppError = require('../utils/AppError');

const REPOS_DIR = path.join(__dirname, '..', 'repos');
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/i;

function assertValidGithubUrl(url) {
  if (!GITHUB_URL_REGEX.test(url.trim())) {
    throw new AppError('Please provide a valid public GitHub repository URL', 400);
  }
}

function deriveRepoName(url) {
  const cleaned = url.trim().replace(/\.git\/?$/, '').replace(/\/$/, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || 'repository';
}

/**
 * Clones a public GitHub repository into server/repos/<uniqueDir>.
 * Uses a shallow clone (depth=1) since only the current file contents are
 * needed for code analysis, not full history.
 */
async function cloneGithubRepository(url) {
  assertValidGithubUrl(url);

  const repoName = deriveRepoName(url);
  const uniqueDir = `${Date.now()}-${repoName}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetPath = path.join(REPOS_DIR, uniqueDir);

  const git = simpleGit();
  try {
    await git.clone(url, targetPath, ['--depth', '1', '--single-branch']);
  } catch (err) {
    throw new AppError(
      `Failed to clone repository. Make sure the URL points to a public GitHub repo. (${err.message})`,
      400
    );
  }

  // Remove the .git folder itself; we only need the working tree for analysis.
  const gitMetaDir = path.join(targetPath, '.git');
  fs.rmSync(gitMetaDir, { recursive: true, force: true });

  return { repoName, storagePath: targetPath };
}

module.exports = { cloneGithubRepository, REPOS_DIR, deriveRepoName };
