import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, MailOpen, Archive, Send, Trash2, Download, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { reportMutationError } from '@/lib/mutations';
import type { ContactMessage } from '@/lib/supabase';
import { PageLoader } from '@/components/Spinner';
import Spinner from '@/components/Spinner';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import { formatDate, cn, exportToCSV, timeAgo } from '@/lib/utils';

type Status = 'all' | ContactMessage['status'];

const statusConfig: Record<
  ContactMessage['status'],
  { variant: 'warning' | 'neutral' | 'success' | 'primary'; icon: React.ComponentType<{ className?: string }> }
> = {
  unread: { variant: 'warning', icon: Mail },
  read: { variant: 'neutral', icon: MailOpen },
  archived: { variant: 'neutral', icon: Archive },
  replied: { variant: 'success', icon: Send },
};

const filters: Status[] = ['all', 'unread', 'read', 'archived', 'replied'];

export default function AdminContactMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get('status') as Status) ?? 'all';
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status>(initialFilter);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<ContactMessage | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setFilter((searchParams.get('status') as Status) ?? 'all');
  }, [searchParams]);

  const filtered = messages.filter((m) => {
    const matchFilter = filter === 'all' || m.status === filter;
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.subject ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openMessage = (m: ContactMessage) => {
    setViewing(m);
    setReply(m.admin_reply ?? '');
    setError(null);
    setNotice(null);
    if (m.status === 'unread') {
      markAsRead(m.id);
    }
  };

  const markAsRead = async (id: string) => {
    setUpdating(true);
    const { error } = await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id);
    if (reportMutationError('mark this message as read', error)) {
      setUpdating(false);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' } : m)));
    setViewing((prev) => (prev?.id === id ? { ...prev, status: 'read' } : prev));
    setUpdating(false);
  };

  const archive = async (id: string) => {
    setUpdating(true);
    const { error } = await supabase.from('contact_messages').update({ status: 'archived' }).eq('id', id);
    if (reportMutationError('archive this message', error)) {
      setUpdating(false);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'archived' } : m)));
    setViewing(null);
    setUpdating(false);
  };

  const sendReply = async () => {
    if (!viewing || !reply.trim()) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    const { data, error: sendError } = await supabase.functions.invoke('send-contact-reply', {
      body: { message_id: viewing.id, reply: reply.trim() },
    });
    setSaving(false);
    const result = data as { success?: boolean; error?: string; message_id?: string; sent_at?: string } | null;
    if (sendError || !result?.success || !result.message_id || !result.sent_at) {
      setError(result?.error ?? sendError?.message ?? 'The email provider did not accept the reply.');
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === viewing.id ? {
          ...m,
          admin_reply: reply.trim(),
          status: 'read',
          reply_message_id: result.message_id!,
          reply_delivery_status: 'sent',
          reply_sent_at: result.sent_at!,
        } : m))
      );
      setViewing((prev) => (prev?.id === viewing.id ? {
        ...prev,
        admin_reply: reply.trim(),
        status: 'read',
        reply_message_id: result.message_id!,
        reply_delivery_status: 'sent',
        reply_sent_at: result.sent_at!,
      } : prev));
      setNotice('Resend accepted the email. It will be marked replied after delivery is confirmed.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('contact_messages').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setViewing(null);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'contact-messages',
      filtered.map((m) => ({
        Name: m.name,
        Email: m.email,
        Phone: m.phone ?? '',
        Subject: m.subject ?? '',
        Message: m.message,
        Status: m.status,
        'Admin Reply': m.admin_reply ?? '',
        Date: formatDate(m.created_at),
      }))
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Contact Messages</h1>
          <p className="text-sm text-ink-500">
            {messages.length} total · {messages.filter((m) => m.status === 'unread').length} unread
          </p>
        </div>
        <button onClick={handleExport} className="btn-outline text-sm">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSearchParams(f === 'all' ? {} : { status: f });
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                filter === f ? 'bg-primary-700 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                    No messages found.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const cfg = statusConfig[m.status];
                  return (
                    <tr key={m.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3 font-medium text-ink-900">{m.name}</td>
                      <td className="px-4 py-3 text-ink-600">{m.email}</td>
                      <td className="px-4 py-3 text-ink-600">{m.subject ?? '—'}</td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="line-clamp-2 text-ink-600">{m.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant}>
                          <cfg.icon className="h-3 w-3" /> {m.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-500">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openMessage(m)}
                          className="text-sm font-semibold text-primary-700 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View / Reply Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Contact Message" size="lg">
        {viewing && (
          <div className="space-y-5">
            {/* Sender info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Name</p>
                <p className="text-ink-900">{viewing.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Email</p>
                <p className="flex items-center gap-1 text-ink-900">
                  <Mail className="h-3.5 w-3.5" /> {viewing.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Phone</p>
                <p className="text-ink-900">{viewing.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Subject</p>
                <p className="text-ink-900">{viewing.subject ?? '—'}</p>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold uppercase text-ink-400">Message</p>
              <p className="mt-1 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">{viewing.message}</p>
              <p className="mt-1.5 text-xs text-ink-400">Received {timeAgo(viewing.created_at)}</p>
            </div>

            {/* Admin reply */}
            <div className="border-t border-ink-100 pt-4">
              <label className="label">Admin Reply</label>
              <textarea
                className="input min-h-[120px] resize-y"
                placeholder="Type your reply here..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-400">
                The message is marked "replied" only after Resend confirms delivery.
              </p>
              {viewing.reply_delivery_status && (
                <p className="mt-2 text-xs font-medium text-ink-600">
                  Email delivery: <span className="capitalize">{viewing.reply_delivery_status}</span>
                  {viewing.reply_message_id ? ` · Provider ID: ${viewing.reply_message_id}` : ''}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={statusConfig[viewing.status].variant}>
                  {viewing.status}
                </Badge>
                {updating && <Spinner className="h-4 w-4" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {viewing.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(viewing.id)}
                    className="btn-outline text-sm"
                  >
                    <MailOpen className="h-4 w-4" /> Mark as Read
                  </button>
                )}
                {viewing.status !== 'archived' && (
                  <button
                    onClick={() => archive(viewing.id)}
                    className="btn-outline text-sm"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                )}
                <button
                  onClick={sendReply}
                  disabled={saving || !reply.trim() || !!viewing.reply_message_id}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {viewing.reply_message_id ? 'Email Submitted' : 'Send Reply Email'}
                </button>
                <button
                  onClick={() => remove(viewing.id)}
                  className="btn-outline text-sm text-error-600 hover:bg-error-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
