import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!match) {
    return <code className={className}>{children}</code>;
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-[var(--color-border)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border-b border-[var(--color-border)]">
        <span className="text-xs font-mono text-[var(--color-text-muted)]">{match[1]}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
          type="button"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={match[1]}
        style={oneDark}
        customStyle={{ margin: 0, background: '#0d1117', fontSize: '0.85rem', padding: '1rem' }}
        wrapLongLines
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`prose-devpilot ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownRenderer);
