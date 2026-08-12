import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await register(form);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Account created! Welcome to DevPilot AI.');
      navigate('/dashboard', { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="flex items-center justify-center gap-2 font-semibold text-xl mb-8">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dark)] flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </span>
          DevPilot <span className="text-[var(--color-accent-light)]">AI</span>
        </Link>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8">
          <h1 className="text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">Start chatting with your codebase in minutes</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-[var(--color-text-secondary)]">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[var(--color-text-secondary)]">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[var(--color-text-secondary)]">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="text-sm text-[var(--color-text-secondary)] text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--color-accent-light)] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
