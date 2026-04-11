'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import { translations, type Lang } from '@/lib/worktime-i18n';

interface Customer {
  id: number;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  active: boolean;
}

export default function WorktimeCustomersPage() {
  const [lang, setLang] = useState<Lang>('de');
  const T = translations[lang];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', email: '', phone: '', notes: '' });

  useEffect(() => {
    const saved = localStorage.getItem('wt_lang') as Lang | null;
    if (saved && ['de', 'en', 'it'].includes(saved)) setLang(saved);
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const res = await fetch('/api/worktime/customers');
    if (res.ok) setCustomers(await res.json());
  }

  function openNew() {
    setForm({ name: '', address: '', email: '', phone: '', notes: '' });
    setEditCustomer(null);
    setShowForm(true);
  }

  function openEdit(c: Customer) {
    setForm({ name: c.name, address: c.address || '', email: c.email || '', phone: c.phone || '', notes: c.notes || '' });
    setEditCustomer(c);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editCustomer ? `/api/worktime/customers/${editCustomer.id}` : '/api/worktime/customers';
    const method = editCustomer ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowForm(false);
    await fetchCustomers();
    setLoading(false);
  }

  async function deleteCustomer(id: number) {
    if (!confirm(lang === 'de' ? 'Kunde löschen?' : lang === 'en' ? 'Delete customer?' : 'Eliminare cliente?')) return;
    await fetch(`/api/worktime/customers/${id}`, { method: 'DELETE' });
    await fetchCustomers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{T.customers}</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4" />{T.newCustomer}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{editCustomer ? T.edit : T.newCustomer}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: `${T.customer} (Name) *`, key: 'name', type: 'text', required: true, full: true },
              { label: T.address, key: 'address', type: 'text', required: false },
              { label: T.email, key: 'email', type: 'email', required: false },
              { label: T.phone, key: 'phone', type: 'tel', required: false },
            ].map(({ label, key, type, required, full }) => (
              <div key={key} className={full ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required={required}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{T.notes}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-60">
                {loading ? T.loading : T.save}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                {T.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customers.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-8 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            {T.noEntries}
          </div>
        ) : customers.map((c) => (
          <div key={c.id} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                <div className="mt-2 space-y-1">
                  {c.address && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />{c.address}
                    </p>
                  )}
                  {c.email && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Mail className="w-3.5 h-3.5 shrink-0" />{c.email}
                    </p>
                  )}
                  {c.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="w-3.5 h-3.5 shrink-0" />{c.phone}
                    </p>
                  )}
                  {c.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">{c.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCustomer(c.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
