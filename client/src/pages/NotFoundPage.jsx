import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] px-4 text-center">
      <Compass size={40} className="text-[var(--color-accent-light)] mb-4" />
      <h1 className="text-3xl font-bold mb-2">404 - Page not found</h1>
      <p className="text-[var(--color-text-secondary)] mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
