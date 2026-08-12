import { useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Check, Download, X } from 'lucide-react';
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';
import Button from './ui/Button';

export default function MarkdownResultPanel({ title, markdown, filename, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'devpilot-output.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="secondary" icon={Download} onClick={handleDownload}>
            Download .md
          </Button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="p-5 max-h-[560px] overflow-y-auto">
        <MarkdownRenderer content={markdown} />
      </div>
    </motion.div>
  );
}
