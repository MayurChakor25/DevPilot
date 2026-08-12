/**
 * Produces a compact, human-readable tree summary (like `tree -L 3`) from
 * a flat fileTree array, used to give the LLM structural awareness without
 * consuming the whole context budget on paths.
 */
function summarizeFileTree(fileTree, maxEntries = 200) {
  const limited = fileTree.slice(0, maxEntries);
  const lines = limited.map((node) => {
    const depth = node.path.split('/').length - 1;
    const indent = '  '.repeat(depth);
    const suffix = node.type === 'directory' ? '/' : '';
    return `${indent}- ${node.path.split('/').pop()}${suffix}`;
  });
  if (fileTree.length > maxEntries) {
    lines.push(`... and ${fileTree.length - maxEntries} more entries`);
  }
  return lines.join('\n');
}

module.exports = { summarizeFileTree };
