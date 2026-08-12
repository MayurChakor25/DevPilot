/**
 * Shared constants describing which files/folders the code processing
 * service should read, and which it should skip entirely.
 */

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  '.vscode',
  '.idea',
  'vendor',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  '.turbo',
  '.parcel-cache',
]);

const IGNORED_FILE_PATTERNS = [
  /^\.DS_Store$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /\.min\.js$/,
  /\.map$/,
];

// Binary / media / archive extensions that should never be read as text.
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg', '.tiff',
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv',
  '.mp3', '.wav', '.ogg', '.flac', '.aac',
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.class', '.jar', '.war',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.db', '.sqlite', '.sqlite3',
]);

// Extensions explicitly supported for AI context building, per spec.
const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx',
  '.json', '.md', '.txt',
  '.java', '.py',
  '.html', '.css', '.scss',
  '.yml', '.yaml', '.xml', '.sql',
]);

const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // skip individual files larger than 1.5MB
const MAX_FILES_PER_REPO = 3000; // safety ceiling to avoid runaway scans
const CHUNK_SIZE_CHARS = 3500; // characters per chunk sent for embedding/context
const CHUNK_OVERLAP_CHARS = 300;

module.exports = {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  BINARY_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_REPO,
  CHUNK_SIZE_CHARS,
  CHUNK_OVERLAP_CHARS,
};
