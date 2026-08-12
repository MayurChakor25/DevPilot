import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ChatBubble from '../components/ChatBubble';
import TypingIndicator from '../components/TypingIndicator';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import api, { getErrorMessage } from '../lib/api';

const SUGGESTED_QUESTIONS = [
  'What does this project do?',
  'Explain the folder structure',
  'Which files handle API routes?',
  'Explain how to run this project',
  'Suggest performance improvements',
];

export default function ChatPage() {
  const { id } = useParams();
  const [repository, setRepository] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoadingHistory(true);
      try {
        const [repoRes, convRes] = await Promise.all([
          api.get(`/repositories/${id}`),
          api.get(`/conversations/${id}`),
        ]);
        setRepository(repoRes.data.data.repository);
        const history = convRes.data.data.conversations.flatMap((c) => [
          { role: 'user', content: c.question, timestamp: c.createdAt },
          { role: 'assistant', content: c.answer, timestamp: c.createdAt, sources: c.sourcesUsed || [] },
        ]);
        setMessages(history);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load chat history'));
      } finally {
        setIsLoadingHistory(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, scrollToBottom]);

  const sendQuestion = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed, timestamp: new Date().toISOString() }]);
    setQuestion('');
    setIsSending(true);

    try {
      const { data } = await api.post('/ai/chat', { repoId: id, question: trimmed });
      const conversation = data.data.conversation;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: conversation.answer,
          timestamp: conversation.createdAt,
          sources: conversation.sourcesUsed || [],
        },
      ]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to get an answer from the AI'));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `_Sorry, something went wrong: ${getErrorMessage(error)}_`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(question);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Navbar />

      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/repositories/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft size={15} /> Back to repository
          </Link>
          {repository && (
            <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[240px]">{repository.name}</span>
          )}
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-[50vh] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 overflow-y-auto space-y-5 mb-4"
        >
          {isLoadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size={24} label="Loading conversation history..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <EmptyState
                icon={MessageSquare}
                title="Ask anything about this repository"
                description="Try one of the suggestions below, or ask your own question."
              />
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {SUGGESTED_QUESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendQuestion(suggestion)}
                    className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatBubble key={index} {...message} />
              ))}
              {isSending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0" />
                  <TypingIndicator />
                </div>
              )}
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this repository..."
            disabled={isSending}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending || !question.trim()}
            className="p-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
