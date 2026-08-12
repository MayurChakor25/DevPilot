import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FolderGit2, Plus, MessageSquare, GitBranch, FolderArchive } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import RepositoryCard from '../components/RepositoryCard';
import ImportRepositoryModal from '../components/ImportRepositoryModal';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import api, { getErrorMessage } from '../lib/api';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recentConversations, setRecentConversations] = useState([]);

  const loadRepositories = useCallback(async () => {
    try {
      const { data } = await api.get('/repositories');
      setRepositories(data.data.repositories);
      return data.data.repositories;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load repositories'));
      return [];
    }
  }, []);

  const loadRecentConversations = useCallback(async (repos) => {
    const readyRepos = repos.filter((r) => r.status === 'ready').slice(0, 5);
    if (readyRepos.length === 0) {
      setRecentConversations([]);
      return;
    }
    try {
      const results = await Promise.all(
        readyRepos.map((repo) =>
          api
            .get(`/conversations/${repo._id}`)
            .then((res) => res.data.data.conversations.map((c) => ({ ...c, repoName: repo.name })))
            .catch(() => [])
        )
      );
      const merged = results
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentConversations(merged);
    } catch {
      setRecentConversations([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const repos = await loadRepositories();
      await loadRecentConversations(repos);
      setIsLoading(false);
    })();
  }, [loadRepositories, loadRecentConversations]);

  // Poll while any repository is still pending/processing so the UI updates automatically.
  useEffect(() => {
    const hasInFlight = repositories.some((r) => r.status === 'pending' || r.status === 'processing');
    if (!hasInFlight) return;
    const interval = setInterval(loadRepositories, 4000);
    return () => clearInterval(interval);
  }, [repositories, loadRepositories]);

  const handleImported = (repository) => {
    setRepositories((prev) => [repository, ...prev]);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/repositories/${pendingDelete._id}`);
      setRepositories((prev) => prev.filter((r) => r._id !== pendingDelete._id));
      toast.success('Repository deleted');
      setPendingDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete repository'));
    } finally {
      setIsDeleting(false);
    }
  };

  const githubCount = repositories.filter((r) => r.source === 'github').length;
  const uploadCount = repositories.filter((r) => r.source === 'upload').length;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Your repositories</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {repositories.length} total &middot; {githubCount} from GitHub &middot; {uploadCount} uploaded
            </p>
          </div>
          <Button icon={Plus} onClick={() => setIsImportOpen(true)}>
            Import repository
          </Button>
        </div>

        {isLoading ? (
          <div className="py-24">
            <Spinner size={28} label="Loading your repositories..." />
          </div>
        ) : repositories.length === 0 ? (
          <EmptyState
            icon={FolderGit2}
            title="No repositories yet"
            description="Import a public GitHub repository or upload a ZIP archive to start chatting with your codebase."
            action={
              <Button icon={Plus} onClick={() => setIsImportOpen(true)}>
                Import your first repository
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <AnimatePresence>
              {repositories.map((repository) => (
                <RepositoryCard key={repository._id} repository={repository} onDelete={setPendingDelete} />
              ))}
            </AnimatePresence>
          </div>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--color-accent-light)]" />
            Recent AI conversations
          </h2>

          {recentConversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Open a repository and start chatting with the AI assistant to see your history here."
            />
          ) : (
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <Link
                  key={conversation._id}
                  to={`/repositories/${conversation.repoId}/chat`}
                  className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-light)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[var(--color-accent-light)] flex items-center gap-1">
                      {conversation.repoName?.length ? (
                        <>
                          {conversation.mode === 'chat' ? <GitBranch size={12} /> : <FolderArchive size={12} />}
                          {conversation.repoName}
                        </>
                      ) : null}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(conversation.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-primary)] truncate">{conversation.question}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <ImportRepositoryModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImported={handleImported} />

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete repository"
        description={`Are you sure you want to delete "${pendingDelete?.name}"? This will permanently remove its files, chunks, and conversation history.`}
      />
    </div>
  );
}
