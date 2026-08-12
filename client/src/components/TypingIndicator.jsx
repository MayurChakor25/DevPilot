export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[var(--color-bg-elevated)] w-fit">
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-light)] typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-light)] typing-dot" style={{ animationDelay: '160ms' }} />
      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-light)] typing-dot" style={{ animationDelay: '320ms' }} />
    </div>
  );
}
