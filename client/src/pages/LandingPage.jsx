import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  GitBranch,
  UploadCloud,
  MessageSquareText,
  FileSearch,
  ShieldCheck,
  BookOpenText,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const FEATURES = [
  {
    icon: GitBranch,
    title: 'Import from GitHub or ZIP',
    description: 'Clone any public GitHub repository or upload a ZIP archive — DevPilot handles both.',
  },
  {
    icon: MessageSquareText,
    title: 'Chat with your codebase',
    description: 'Ask questions in plain English and get accurate, context-aware answers backed by Gemini.',
  },
  {
    icon: BookOpenText,
    title: 'Auto-generate README & docs',
    description: 'Generate a polished README, API documentation, and repository summaries in one click.',
  },
  {
    icon: FileSearch,
    title: 'Find bugs & security issues',
    description: 'Surface potential bugs, dead code, duplicate logic, and security concerns with severity levels.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    description: 'JWT auth, rate limiting, safe ZIP extraction, and strict input validation out of the box.',
  },
  {
    icon: UploadCloud,
    title: 'Smart code processing',
    description: 'Recursively scans, chunks, and indexes your files while skipping binaries and build output.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] overflow-x-hidden">
      <Navbar />

      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[600px] h-[600px] bg-[var(--color-accent)]/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-secondary)] mb-6"
        >
          <Bot size={14} className="text-[var(--color-accent-light)]" />
          Powered by Google Gemini
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl sm:text-6xl font-bold tracking-tight mb-6"
        >
          Your AI pair-programmer for
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-light)] to-[var(--color-accent)]">
            any codebase
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10"
        >
          Import a GitHub repository or upload a ZIP file, then chat with an AI that actually
          understands your code. Generate READMEs, API docs, and bug reports in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white font-medium transition-colors shadow-[0_0_30px_rgba(124,92,255,0.35)]"
          >
            Get started free <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] font-medium transition-colors"
          >
            Log in
          </Link>
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                <feature.icon size={20} className="text-[var(--color-accent-light)]" />
              </div>
              <h3 className="font-semibold mb-1.5">{feature.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] py-8 text-center text-sm text-[var(--color-text-muted)]">
        Built with React, Express, MongoDB &amp; Google Gemini. &copy; {new Date().getFullYear()} DevPilot AI.
      </footer>
    </div>
  );
}
