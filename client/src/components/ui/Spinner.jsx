import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 20, label = '', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-[var(--color-text-muted)] ${className}`}>
      <Loader2 size={size} className="animate-spin text-[var(--color-accent)]" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
