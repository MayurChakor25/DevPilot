import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  BookOpenText,
  Bug,
  FileCode2,
  FileText,
  GitBranch,
  FolderArchive,
  MessageSquare,
  ScrollText,
  Trash2,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import FileTree from '../components/FileTree';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MarkdownResultPanel from '../components/MarkdownResultPanel';
import api, { getErrorMessage } from '../lib/api';

const AI_TOOLS = [
  {
    key: 'readme',
    label: 'Generate README',
    icon: BookOpenText,
    endpoint: (id) => `/repositories/${id}/generate-readme`,
    filename: 'README.md',
  },
  {
    key: 'docs',
    label: 'Generate API docs',
    icon: FileText,
    endpoint: () => '/ai/generate-docs',
    filename: 'API_DOCS.md',
  },
  {
    key: 'bugs',
    label: 'Find bugs',
    icon: Bug,
    endpoint: () => '/ai/find-bugs',
    filename: 'BUG_REPORT.md',
  },
];

export default function RepositoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repository, setRepository] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState(null);
  const [toolResult, setToolResult] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRepository = useCallback(async () => {
    try {
      const { data } = await api.get(`/repositories/${id}`);
      setRepository(data.data.repository);
      return data.data.repository;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load repository'));
      return null;
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await loadRepository();
      setIsLoading(false);
    })();
  }, [loadRepository]);

  useEffect(() => {
    if (!repository) return undefined;
    if (repository.status !== 'pending' && repository.status !== 'processing') return undefined;
    const interval = setInterval(loadRepository, 4000);
    return () => clearInterval(interval);
  }, [repository, loadRepository]);

  const runTool = async (tool) => {
    setActiveTool(tool.key);
    setToolResult(null);
    try {
      const { data } = await api.post(tool.endpoint(id), { repoId: id });
      setToolResult({ title: tool.label, markdown: data.data.markdown, filename: tool.filename });
    } catch (error) {
      toast.error(getErrorMessage(error, `Failed to run "${tool.label}"`));
    } finally {
      setActiveTool(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/repositories/${id}`);
      toast.success('Repository deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete repository'));
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Navbar />
        <div className="py-24">
          <Spinner size={28} label="Loading repository..." />
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-24 text-center text-[var(--color-text-secondary)]">
          Repository not found.
        </div>
      </div>
    );
  }

  const notReady = repository.status !== 'ready';

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
              {repository.source === 'github' ? (
                <GitBranch size={22} className="text-[var(--color-accent-light)]" />
              ) : (
                <FolderArchive size={22} className="text-[var(--color-accent-light)]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{repository.name}</h1>
              {repository.sourceUrl && (
                <a
                  href={repository.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--color-accent-light)] hover:underline"
                >
                  {repository.sourceUrl}
                </a>
              )}
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1">
                <span className="capitalize">{repository.status}</span>
                <span>&middot;</span>
                <span>{repository.stats?.processedFiles ?? 0} files processed</span>
                <span>&middot;</span>
                <span>{repository.stats?.totalChunks ?? 0} chunks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/repositories/${id}/chat`}>
              <Button icon={MessageSquare} disabled={notReady}>
                Open chat
              </Button>
            </Link>
            <Button variant="danger" icon={Trash2} onClick={() => setIsDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>

        {repository.status === 'failed' && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300">
            Processing failed: {repository.errorMessage || 'Unknown error'}
          </div>
        )}
        {notReady && repository.status !== 'failed' && (
          <div className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-300 flex items-center gap-2">
            <Spinner size={16} />
            This repository is still being processed. AI tools will be available once it&apos;s ready.
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <FileCode2 size={16} className="text-[var(--color-accent-light)]" /> File tree
              </h2>
              <FileTree fileTree={repository.fileTree} />
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
              <h2 className="font-semibold flex items-center gap-2 mb-4">
                <ScrollText size={16} className="text-[var(--color-accent-light)]" /> AI tools
              </h2>
              <div className="space-y-2">
                {AI_TOOLS.map((tool) => (
                  <Button
                    key={tool.key}
                    variant="secondary"
                    icon={tool.icon}
                    className="w-full justify-start"
                    isLoading={activeTool === tool.key}
                    disabled={notReady || Boolean(activeTool)}
                    onClick={() => runTool(tool)}
                  >
                    {tool.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {toolResult ? (
              <MarkdownResultPanel
                title={toolResult.title}
                markdown={toolResult.markdown}
                filename={toolResult.filename}
                onClose={() => setToolResult(null)}
              />
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-secondary)]/50 flex flex-col items-center justify-center text-center py-20 px-6">
                <ScrollText size={28} className="text-[var(--color-text-muted)] mb-3" />
                <h3 className="font-semibold mb-1">Run an AI tool</h3>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                  Generate a README, API documentation, or a bug report using the tools on the left.
                  Results appear here and can be copied or downloaded as markdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete repository"
        description={`Are you sure you want to delete "${repository.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
