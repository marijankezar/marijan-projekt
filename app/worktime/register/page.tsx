'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, UserPlus, CheckCircle } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface Company {
  id: number;
  name: string;
}

export default function WorktimeRegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/worktime/companies')
      .then((r) => r.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/worktime/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, company_id: parseInt(form.company_id), lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || T.error);
        return;
      }
      setSuccess(true);
    } catch {
      setError(T.error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{T.success}!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{T.registerSuccess}</p>
          <button
            onClick={() => router.push('/worktime/login')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:scale-[1.02] transition-all"
          >
            {T.login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Lang Switcher */}
        <div className="flex justify-center gap-2 mb-6">
          {(['de', 'en', 'it'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                lang === l
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-xl p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{T.register}</h1>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{T.firstName}</label>
                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{T.lastName}</label>
                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            </div>

            {[
              { label: T.username, key: 'username', type: 'text', required: true },
              { label: T.email, key: 'email', type: 'email', required: true },
              { label: T.password, key: 'password', type: 'password', required: true },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={required}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{T.company} *</label>
              <select
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">{lang === 'de' ? '— Unternehmen wählen —' : lang === 'en' ? '— Select company —' : '— Seleziona azienda —'}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? T.loading : T.register}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {lang === 'de' ? 'Bereits registriert?' : lang === 'en' ? 'Already registered?' : 'Già registrato?'}{' '}
            <Link href="/worktime/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
              {T.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
