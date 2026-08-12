export default function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-secondary)]/50">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
          <Icon size={26} className="text-[var(--color-accent-light)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
