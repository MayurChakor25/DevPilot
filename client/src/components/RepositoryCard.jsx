import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, FolderArchive, Trash2, FileCode2, Clock } from 'lucide-react';
import clsx from 'clsx';

const STATUS_STYLES = {
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function RepositoryCard({ repository, onDelete }) {
  const isGithub = repository.source === 'github';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 hover:border-[var(--color-border-light)] transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
          {isGithub ? (
            <GitBranch size={18} className="text-[var(--color-accent-light)]" />
          ) : (
            <FolderArchive size={18} className="text-[var(--color-accent-light)]" />
          )}
        </div>
        <span
          className={clsx(
            'text-xs px-2 py-1 rounded-full border capitalize',
            STATUS_STYLES[repository.status] || STATUS_STYLES.pending
          )}
        >
          {repository.status}
        </span>
      </div>

      <Link to={`/repositories/${repository._id}`}>
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 truncate hover:text-[var(--color-accent-light)] transition-colors">
          {repository.name}
        </h3>
      </Link>

      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-4">
        <span className="flex items-center gap-1">
          <FileCode2 size={13} /> {repository.stats?.processedFiles ?? 0} files
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} /> {new Date(repository.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to={`/repositories/${repository._id}`}
          className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          Open
        </Link>
        <Link
          to={`/repositories/${repository._id}/chat`}
          className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent-light)] hover:bg-[var(--color-accent)]/25 transition-colors"
        >
          Chat
        </Link>
        <button
          type="button"
          onClick={() => onDelete(repository)}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-500/10 transition-colors cursor-pointer"
          aria-label="Delete repository"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}
