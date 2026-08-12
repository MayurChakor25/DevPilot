import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { GitBranch, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import Modal from './ui/Modal';
import Button from './ui/Button';
import api, { getErrorMessage } from '../lib/api';

export default function ImportRepositoryModal({ isOpen, onClose, onImported }) {
  const [tab, setTab] = useState('github');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setGithubUrl('');
    setFile(null);
    setTab('github');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleImportGithub = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/repositories/import-github', { url: githubUrl.trim() });
      toast.success('Repository imported successfully');
      onImported(data.data.repository);
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to import repository'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a ZIP file to upload');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/repositories/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Repository uploaded successfully');
      onImported(data.data.repository);
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to upload repository'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import a repository">
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setTab('github')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            tab === 'github' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
          )}
        >
          <GitBranch size={15} /> GitHub URL
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
            tab === 'upload' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white'
          )}
        >
          <UploadCloud size={15} /> Upload ZIP
        </button>
      </div>

      {tab === 'github' ? (
        <form onSubmit={handleImportGithub} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 text-[var(--color-text-secondary)]">
              Public GitHub repository URL
            </label>
            <input
              type="url"
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/facebook/react"
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
              Only public repositories are supported. A shallow clone will be fetched for analysis.
            </p>
          </div>
          <Button type="submit" isLoading={isSubmitting} className="w-full" icon={GitBranch}>
            Import repository
          </Button>
        </form>
      ) : (
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 text-[var(--color-text-secondary)]">ZIP file</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-primary)] py-8 flex flex-col items-center justify-center text-center hover:border-[var(--color-accent)] transition-colors"
            >
              <UploadCloud size={26} className="text-[var(--color-accent-light)] mb-2" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {file ? file.name : 'Click to select a .zip archive (max 50MB)'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <Button type="submit" isLoading={isSubmitting} className="w-full" icon={UploadCloud}>
            Upload &amp; process
          </Button>
        </form>
      )}
    </Modal>
  );
}
