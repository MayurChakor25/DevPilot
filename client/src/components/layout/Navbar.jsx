import { Link, useNavigate } from 'react-router-dom';
import { Bot, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 font-semibold text-lg">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </span>
          DevPilot <span className="text-[var(--color-accent-light)]">AI</span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <div className="hidden sm:block text-sm text-[var(--color-text-secondary)]">
              {user?.name}
            </div>
            <button
              onClick={handleLogout}
              type="button"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white transition-colors"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
