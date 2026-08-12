import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatBubble({ role, content, timestamp, sources = [] }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-[var(--color-bg-elevated)]' : 'bg-[var(--color-accent)]/20'
        }`}
      >
        {isUser ? (
          <User size={15} className="text-[var(--color-text-secondary)]" />
        ) : (
          <Bot size={15} className="text-[var(--color-accent-light)]" />
        )}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]'
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownRenderer content={content} className="text-sm" />
          )}
        </div>

        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {sources.slice(0, 6).map((source) => (
              <span
                key={source}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] font-mono truncate max-w-[160px]"
                title={source}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        {timestamp && (
          <span className="text-[11px] text-[var(--color-text-muted)] mt-1">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
