import { useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useT } from '../useT';
import type { Lang } from '../i18n';

const LANG_LABELS: Record<Lang, string> = { it: 'IT 🇮🇹', br: 'BR 🇧🇷' };

export default function LoginPage() {
  const { login, lang, setLang, sessionExpired } = useStore();
  const t = useT();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-8">
        {/* Session-expired notice */}
        {sessionExpired && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <Clock size={14} className="shrink-0 text-amber-500" />
            {t.sessionExpiredNotice}
          </div>
        )}

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="bg-brand-700 text-white rounded-full p-3">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-wide">Comunicar</h1>
          <p className="text-xs text-gray-400">{t.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t.loginEmail}</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              placeholder="usuario@escola.com.br"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{t.loginPassword}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white rounded py-2 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors mt-1"
          >
            {loading ? t.loginLoading : t.loginButton}
          </button>
        </form>

        {/* Language switcher */}
        <div className="flex justify-center gap-1 mt-6">
          {(['it', 'br'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                lang === l
                  ? 'border-brand-500 text-brand-700 bg-brand-50 font-semibold'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
