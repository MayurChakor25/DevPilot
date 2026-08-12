const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const AppError = require('../utils/AppError');
const { IGNORED_DIRECTORIES, BINARY_EXTENSIONS } = require('../utils/fileRules');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Extracts a ZIP archive safely into a unique folder under server/temp.
 *
 * Safety measures against malicious archives ("zip-slip" and similar):
 * - Every resolved entry path is checked to remain inside the destination
 *   directory; any entry attempting to escape (e.g. via `../`) is skipped.
 * - Absolute paths and paths containing null bytes are rejected.
 * - Symlinks are ignored (not followed/created).
 * - Files inside ignored directories (node_modules, .git, etc.) are skipped
 *   to avoid extracting huge, irrelevant trees.
 */
async function extractZipSafely(zipFilePath) {
  const uniqueDir = `${Date.now()}-extracted`;
  const destinationRoot = path.join(TEMP_DIR, uniqueDir);
  fs.mkdirSync(destinationRoot, { recursive: true });

  const directory = await unzipper.Open.file(zipFilePath);

  for (const entry of directory.files) {
    const entryPath = entry.path;

    if (!entryPath || entryPath.includes('\u0000') || path.isAbsolute(entryPath)) {
      continue;
    }

    const normalizedRelative = path.normalize(entryPath);
    if (normalizedRelative.split(path.sep).includes('..')) {
      continue; // reject path traversal attempts
    }

    const segments = normalizedRelative.split(path.sep);
    if (segments.some((segment) => IGNORED_DIRECTORIES.has(segment))) {
      continue;
    }

    const destinationPath = path.join(destinationRoot, normalizedRelative);
    const resolvedDestination = path.resolve(destinationPath);
    const resolvedRoot = path.resolve(destinationRoot);

    if (!resolvedDestination.startsWith(resolvedRoot + path.sep) && resolvedDestination !== resolvedRoot) {
      continue; // extra guard: resolved path escapes destination root
    }

    if (entry.type === 'Directory') {
      fs.mkdirSync(resolvedDestination, { recursive: true });
      continue;
    }

    // Skip obviously binary content by extension to save disk + time.
    const ext = path.extname(entryPath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) continue;

    fs.mkdirSync(path.dirname(resolvedDestination), { recursive: true });

    await new Promise((resolve, reject) => {
      entry
        .stream()
        .pipe(fs.createWriteStream(resolvedDestination))
        .on('finish', resolve)
        .on('error', reject);
    });
  }

  return destinationRoot;
}

async function safeUnlink(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    // ignore missing file errors
  }
}

function validateIsZip(file) {
  if (!file) {
    throw new AppError('No file uploaded', 400);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.zip') {
    throw new AppError('Only .zip files are supported', 400);
  }
}

module.exports = { extractZipSafely, safeUnlink, validateIsZip, TEMP_DIR };
