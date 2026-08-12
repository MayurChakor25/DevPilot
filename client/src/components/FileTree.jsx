import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder } from 'lucide-react';

/** Builds a nested tree structure from the flat `{ path, type }[]` list returned by the API. */
function buildTree(fileTree) {
  const root = { name: '', children: new Map(), type: 'directory' };

  for (const node of fileTree) {
    const segments = node.path.split('/');
    let current = root;
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      if (!current.children.has(segment)) {
        current.children.set(segment, {
          name: segment,
          type: isLast ? node.type : 'directory',
          children: new Map(),
        });
      }
      current = current.children.get(segment);
    });
  }

  return root;
}

function TreeNode({ node, depth }) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const hasChildren = node.children.size > 0;
  const sortedChildren = useMemo(
    () =>
      Array.from(node.children.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [node.children]
  );

  if (node.type === 'directory') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 w-full text-left py-1 rounded hover:bg-[var(--color-bg-hover)] cursor-pointer"
          style={{ paddingLeft: depth * 14 }}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown size={13} className="text-[var(--color-text-muted)] shrink-0" />
            ) : (
              <ChevronRight size={13} className="text-[var(--color-text-muted)] shrink-0" />
            )
          ) : (
            <span className="w-[13px]" />
          )}
          <Folder size={14} className="text-[var(--color-accent-light)] shrink-0" />
          <span className="text-sm truncate">{node.name}</span>
        </button>
        {isOpen &&
          sortedChildren.map((child) => <TreeNode key={child.name} node={child} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 py-1 rounded hover:bg-[var(--color-bg-hover)]"
      style={{ paddingLeft: depth * 14 + 19 }}
    >
      <File size={13} className="text-[var(--color-text-muted)] shrink-0" />
      <span className="text-sm text-[var(--color-text-secondary)] truncate">{node.name}</span>
    </div>
  );
}

export default function FileTree({ fileTree }) {
  const root = useMemo(() => buildTree(fileTree || []), [fileTree]);
  const sortedRootChildren = useMemo(
    () =>
      Array.from(root.children.values()).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [root]
  );

  if (!fileTree || fileTree.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)]">No files found.</p>;
  }

  return (
    <div className="font-mono text-sm max-h-[480px] overflow-y-auto pr-2">
      {sortedRootChildren.map((child) => (
        <TreeNode key={child.name} node={child} depth={0} />
      ))}
    </div>
  );
}
