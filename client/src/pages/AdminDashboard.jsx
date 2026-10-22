import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';

/* ── helpers ── */
const cls = (...a) => a.filter(Boolean).join(' ');

const BADGE = {
  confirmed:        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  pending:          'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  cancelled:        'bg-red-500/15 text-red-400 border border-red-500/25',
  awaiting_payment: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  paid:             'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
  not_paid:         'bg-white/5 text-gray-500 border border-white/10',
  refund_pending:   'bg-pink-500/15 text-pink-400 border border-pink-500/25',
  refunded:         'bg-teal-500/15 text-teal-400 border border-teal-500/25',
  read:             'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  replied:          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
};

const Badge = ({ status }) => (
  <span className={cls('px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider', BADGE[status] || 'bg-white/5 text-gray-500 border border-white/10')}>
    {String(status || '').replace(/_/g, ' ')}
  </span>
);

const StatCard = ({ label, value, icon, sub, accent }) => (
  <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden group cursor-default">
    <div className={cls('absolute top-0 left-0 right-0 h-0.5', accent || 'bg-gradient-to-r from-indigo-500 to-purple-500')} />
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-1">{label}</p>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-black text-white">{value}</p>
      <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
    </div>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

/* ── EventForm ── */
const EventForm = ({ data, setData, onSubmit, onCancel, submitLabel }) => {
  const field = (key) => ({
    value: data[key] ?? '',
    onChange: (e) => setData({ ...data, [key]: e.target.value }),
  });
  const inp = 'w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm';
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input required type="text" placeholder="Event Title" className={inp} {...field('title')} />
      <input required type="text" placeholder="Category (e.g. Tech, Music)" className={inp} {...field('category')} />
      <input required type="date" className={inp} {...field('date')} />
      <input required type="text" placeholder="Location" className={inp} {...field('location')} />
      <input required type="number" min="1" placeholder="Total Seats" className={inp} {...field('totalSeats')} />
      <input required type="number" min="0" placeholder="Ticket Price (0 = Free)" className={inp} {...field('ticketPrice')} />
      <div className="md:col-span-2">
        <input type="text" placeholder="Image URL (optional)" className={inp} {...field('image')} />
      </div>
      <textarea required placeholder="Event Description" rows={4} className={cls(inp, 'md:col-span-2 resize-none')} {...field('description')} />
      <div className="md:col-span-2 flex gap-3">
        <button type="button" onClick={onCancel} className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold py-3 rounded-xl transition">Cancel</button>
        <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25">{submitLabel}</button>
      </div>
    </form>
  );
};

/* ── PaymentHistory ── */
const PaymentHistory = ({ bookings, onRefund }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const safe = Array.isArray(bookings) ? bookings : [];
  const filtered = safe.filter((b) => {
    const q = search.toLowerCase();
    const ms = !q || b.userId?.name?.toLowerCase().includes(q) || b.userId?.email?.toLowerCase().includes(q) || b.eventId?.title?.toLowerCase().includes(q) || b.txnId?.toLowerCase().includes(q);
    const mf = filter === 'all' || (filter === 'paid' && b.paymentStatus === 'paid') || (filter === 'pending' && b.paymentStatus === 'not_paid' && b.status !== 'cancelled') || (filter === 'refund' && b.refundStatus === 'pending') || (filter === 'free' && Number(b.amount) === 0);
    return ms && mf;
  });
  const revenue = safe.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').reduce((s, b) => s + Number(b.amount || 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Collected" value={`₹${revenue}`} icon="💰" accent="bg-gradient-to-r from-emerald-500 to-teal-500" />
        <StatCard label="Paid Txns" value={safe.filter(b => b.paymentStatus === 'paid').length} icon="💳" accent="bg-gradient-to-r from-indigo-500 to-blue-500" />
        <StatCard label="Pending Refunds" value={safe.filter(b => b.refundStatus === 'pending').length} icon="↩️" accent="bg-gradient-to-r from-pink-500 to-rose-500" />
        <StatCard label="Cancelled" value={safe.filter(b => b.status === 'cancelled').length} icon="❌" accent="bg-gradient-to-r from-red-500 to-orange-500" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search user, event, txn ID..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex gap-2 flex-wrap">
          {[['all','All'],['paid','✅ Paid'],['pending','⏳ Pending'],['refund','↩️ Refunds'],['free','🆓 Free']].map(([f,l]) => (
            <button key={f} onClick={() => setFilter(f)} className={cls('px-3 py-2 rounded-xl text-xs font-bold transition-all', filter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>{['#','User','Event','Amount','Status','Refund','Txn ID','Date','Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-12 text-gray-600">No records found.</td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b._id || i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 text-gray-600 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-4"><p className="font-bold text-white whitespace-nowrap">{b.userId?.name || '—'}</p><p className="text-gray-500 text-xs">{b.userId?.email}</p></td>
                  <td className="px-4 py-4"><p className="font-semibold text-gray-300 max-w-[140px] truncate">{b.eventId?.title || 'Deleted'}</p></td>
                  <td className="px-4 py-4 font-black text-white whitespace-nowrap">{Number(b.amount) === 0 ? <span className="text-emerald-400">Free</span> : `₹${b.amount}`}</td>
                  <td className="px-4 py-4"><div className="flex flex-col gap-1"><Badge status={b.status} /><Badge status={b.paymentStatus} /></div></td>
                  <td className="px-4 py-4">{b.refundStatus && b.refundStatus !== 'none' ? <Badge status={b.refundStatus === 'pending' ? 'refund_pending' : 'refunded'} /> : <span className="text-gray-700 text-xs">—</span>}</td>
                  <td className="px-4 py-4">{b.txnId ? <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{b.txnId}</span> : <span className="text-gray-700 text-xs">—</span>}</td>
                  <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{b.bookedAt ? new Date(b.bookedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-4">{b.refundStatus === 'pending' && (
                    <button onClick={() => onRefund(b._id)} className="bg-pink-500/15 text-pink-400 hover:bg-pink-500 hover:text-white border border-pink-500/25 text-xs font-bold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap">↩ Refunded</button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-xs text-gray-600">
            Showing {filtered.length} of {safe.length} records
            {filter === 'paid' && <span className="ml-3 text-emerald-400 font-bold">Total: ₹{filtered.reduce((s, b) => s + Number(b.amount || 0), 0)}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── EnquiriesPanel ── */
const EnquiriesPanel = ({ enquiries, onReply, onMarkRead, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const safe = Array.isArray(enquiries) ? enquiries : [];
  const filtered = safe.filter(e => {
    const q = search.toLowerCase();
    const ms = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.subject?.toLowerCase().includes(q);
    const mf = filter === 'all' || e.status === filter;
    return ms && mf;
  });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Enquiries" value={safe.length} icon="💬" accent="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard label="Pending" value={safe.filter(e => e.status === 'pending').length} icon="🔔" accent="bg-gradient-to-r from-orange-500 to-yellow-500" sub="Need attention" />
        <StatCard label="Replied" value={safe.filter(e => e.status === 'replied').length} icon="✅" accent="bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search name, email, subject..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <div className="flex gap-2 flex-wrap">
          {[['all','All'],['pending','🔔 Pending'],['read','👁 Read'],['replied','✅ Replied']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} className={cls('px-3 py-2 rounded-xl text-xs font-bold transition-all', filter === v ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">💬 Customer Enquiries</h2>
          <span className="text-xs font-bold bg-white/5 text-gray-500 px-3 py-1.5 rounded-full">{filtered.length} shown</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center"><div className="text-4xl mb-3">📭</div><p className="text-gray-600">No enquiries found.</p></div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(enq => (
              <div key={enq._id} className={cls('p-5 hover:bg-white/5 transition-all', enq.status === 'pending' && 'border-l-4 border-l-orange-400')}>
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-white">{enq.subject || 'General Enquiry'}</h3>
                      <Badge status={enq.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
                      <span>👤 {enq.name}</span><span>✉️ {enq.email}</span>
                      <span>📅 {enq.createdAt ? new Date(enq.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-2">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2">Message</p>
                      <p className="text-sm text-gray-300 whitespace-pre-line leading-6 line-clamp-3">{enq.message}</p>
                    </div>
                    {enq.adminReply && (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                        <p className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-2">Your Reply</p>
                        <p className="text-sm text-indigo-200 whitespace-pre-line leading-6 line-clamp-2">{enq.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex lg:flex-col gap-2 lg:w-32 shrink-0">
                    <button onClick={() => onReply(enq)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20">
                      💬 {enq.adminReply ? 'Reply Again' : 'Reply'}
                    </button>
                    {enq.status === 'pending' && (
                      <button onClick={() => onMarkRead(enq._id)} className="flex-1 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all">
                        👁 Mark Read
                      </button>
                    )}
                    <button onClick={() => onDelete(enq._id)} className="flex-1 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all">
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── ReplyModal ── */
const ReplyModal = ({ enquiry, onClose, onSend }) => {
  const [text, setText] = useState(enquiry?.adminReply || '');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await onSend(enquiry._id, text.trim());
    setLoading(false);
  };
  if (!enquiry) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-1">Reply to Enquiry</p>
            <h2 className="text-xl font-black text-white">💬 {enquiry.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{enquiry.email}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-gray-500 transition-all shrink-0">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2">Subject</p>
            <p className="font-bold text-white mb-3">{enquiry.subject}</p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2">Customer Message</p>
            <p className="text-sm text-gray-300 whitespace-pre-line leading-6">{enquiry.message}</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Your Reply</label>
            <textarea required rows={7} value={text} onChange={e => setText(e.target.value)} placeholder="Write your reply..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition" />
            <p className="text-xs text-gray-600 mt-1">This will be emailed to <span className="text-gray-400 font-bold">{enquiry.email}</span></p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold py-3 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25 disabled:opacity-60">
              {loading ? 'Sending...' : '✉️ Send Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── AdminDashboard ── */
const EMPTY_FORM = { title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' };

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [events,    setEvents]    = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [showEventForm,  setShowEventForm]  = useState(false);
  const [formData,       setFormData]       = useState(EMPTY_FORM);
  const [editingId,      setEditingId]      = useState(null);
  const [editFormData,   setEditFormData]   = useState({});

  const [replyEnquiry,   setReplyEnquiry]   = useState(null);
  const [showPaySettings, setShowPaySettings] = useState(false);
  const [payForm, setPayForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eventora_pay') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchAll();
  }, [user, navigate]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ev, bk, enq] = await Promise.all([api.get('/events'), api.get('/bookings/my'), api.get('/enquiries')]);
      setEvents(Array.isArray(ev.data) ? ev.data : []);
      setBookings(Array.isArray(bk.data) ? bk.data : []);
      setEnquiries(Array.isArray(enq.data) ? enq.data : []);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) navigate('/login');
    } finally { setLoading(false); }
  };

  /* events */
  const createEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', { ...formData, totalSeats: Number(formData.totalSeats), ticketPrice: Number(formData.ticketPrice) });
      setShowEventForm(false); setFormData(EMPTY_FORM); fetchAll();
    } catch (err) { alert(err?.response?.data?.message || 'Error creating event'); }
  };
  const updateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${editingId}`, { ...editFormData, totalSeats: Number(editFormData.totalSeats), ticketPrice: Number(editFormData.ticketPrice) });
      setEditingId(null); fetchAll();
    } catch (err) { alert(err?.response?.data?.message || 'Error updating event'); }
  };
  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try { await api.delete(`/events/${id}`); fetchAll(); }
    catch (err) { alert(err?.response?.data?.message || 'Error deleting event'); }
  };
  const startEdit = (ev) => {
    setEditingId(ev._id);
    setEditFormData({ title: ev.title, description: ev.description, date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '', location: ev.location, category: ev.category, totalSeats: ev.totalSeats ?? '', ticketPrice: ev.ticketPrice ?? '', image: ev.image || '' });
  };

  /* bookings */
  const confirmBooking = async (id, paymentStatus) => {
    try { await api.put(`/bookings/${id}/confirm`, { paymentStatus }); fetchAll(); }
    catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };
  const rejectBooking = async (id) => {
    if (!window.confirm('Reject this booking?')) return;
    try { await api.delete(`/bookings/${id}`); fetchAll(); }
    catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };
  const processRefund = async (id) => {
    if (!window.confirm('Mark refund as processed?')) return;
    try { await api.put(`/bookings/${id}/refund`); fetchAll(); }
    catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };

  /* enquiries */
  const markRead = async (id) => {
    try {
      const { data } = await api.patch(`/enquiries/${id}/read`);
      setEnquiries(prev => prev.map(e => e._id === id ? (data.enquiry || { ...e, status: 'read' }) : e));
    } catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };
  const deleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await api.delete(`/enquiries/${id}`); setEnquiries(prev => prev.filter(e => e._id !== id)); }
    catch (err) { alert(err?.response?.data?.message || 'Error'); }
  };
  const sendReply = async (id, reply) => {
    try {
      const { data } = await api.post(`/enquiries/${id}/reply`, { reply });
      setEnquiries(prev => prev.map(e => e._id === id ? (data.enquiry || { ...e, status: 'replied', adminReply: reply }) : e));
      setReplyEnquiry(null);
      alert('Reply sent successfully!');
    } catch (err) { alert(err?.response?.data?.message || 'Failed to send reply'); }
  };

  /* stats */
  const safe = Array.isArray(bookings) ? bookings : [];
  const revenue      = safe.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').reduce((s, b) => s + Number(b.amount || 0), 0);
  const pendingCount = safe.filter(b => b.status === 'pending').length;
  const refundCount  = safe.filter(b => b.refundStatus === 'pending').length;
  const paidClients  = new Set(safe.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id).filter(Boolean)).size;
  const pendingEnq   = enquiries.filter(e => e.status === 'pending').length;

  const TABS = [
    { id: 'dashboard', label: '📋 Dashboard' },
    { id: 'history',   label: '💳 Payments',  badge: safe.filter(b => b.paymentStatus === 'paid').length },
    { id: 'refunds',   label: '↩️ Refunds',   badge: refundCount },
    { id: 'enquiries', label: '💬 Enquiries',  badge: pendingEnq },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading admin panel...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen theme-transition ${dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Admin Panel</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">⚡ Eventora Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage events, bookings, payments & enquiries.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowPaySettings(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm">
                💳 Payment Settings
              </button>
              <button onClick={() => { setShowEventForm(v => !v); setFormData(EMPTY_FORM); }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 px-5 rounded-xl transition shadow-lg shadow-indigo-500/25 text-sm">
                {showEventForm ? '✕ Close' : '＋ Create Event'}
              </button>
              <button onClick={toggle}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title={dark ? 'Light Mode' : 'Dark Mode'}>
                {dark ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cls('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
                activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
              {t.label}
              {t.badge !== undefined && (
                <span className={cls('min-w-5 h-5 px-1.5 rounded-full text-[10px] flex items-center justify-center font-black',
                  activeTab === t.id ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500')}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Payment History Tab */}
        {activeTab === 'history' && <PaymentHistory bookings={safe} onRefund={processRefund} />}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-black text-white">↩️ Pending Refunds</h2>
              <p className="text-sm text-gray-500 mt-1">Review and process pending refund requests.</p>
            </div>
            {safe.filter(b => b.refundStatus === 'pending').length === 0 ? (
              <div className="p-16 text-center"><div className="text-4xl mb-3">✅</div><p className="text-gray-600">No pending refunds.</p></div>
            ) : safe.filter(b => b.refundStatus === 'pending').map(b => (
              <div key={b._id} className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/5 transition-all">
                <div>
                  <h3 className="font-bold text-white">{b.eventId?.title || 'Deleted Event'}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{b.userId?.name} · {b.userId?.email}</p>
                  <p className="text-xs text-gray-600 mt-1 italic">{b.cancellationNote}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xl font-black text-pink-400">₹{b.amount}</span>
                  <button onClick={() => processRefund(b._id)}
                    className="bg-pink-500/15 hover:bg-pink-500 text-pink-400 hover:text-white border border-pink-500/25 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
                    ↩ Mark Refunded
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enquiries Tab */}
        {activeTab === 'enquiries' && (
          <EnquiriesPanel enquiries={enquiries} onReply={setReplyEnquiry} onMarkRead={markRead} onDelete={deleteEnquiry} />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Events"   value={events.length}   icon="📅" accent="bg-gradient-to-r from-blue-500 to-indigo-500"   sub="Published" />
              <StatCard label="Total Bookings" value={safe.length}     icon="🎟️" accent="bg-gradient-to-r from-purple-500 to-pink-500"   sub={`${pendingCount} pending`} />
              <StatCard label="Revenue"        value={`₹${revenue}`}  icon="💰" accent="bg-gradient-to-r from-emerald-500 to-teal-500"  sub={`${paidClients} paid clients`} />
              <StatCard label="Pending Refunds" value={refundCount}   icon="↩️" accent="bg-gradient-to-r from-pink-500 to-rose-500"     sub={refundCount > 0 ? 'Action required' : 'All clear'} />
            </div>

            {/* Create Event Form */}
            {showEventForm && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-black text-white mb-5">＋ Create New Event</h2>
                <EventForm data={formData} setData={setFormData} onSubmit={createEvent} onCancel={() => setShowEventForm(false)} submitLabel="Publish Event" />
              </div>
            )}

            {/* Events + Bookings grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Events */}
              <div>
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-xs flex items-center justify-center font-black text-gray-400">{events.length}</span>
                  All Events
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {events.length === 0 ? (
                      <li className="p-8 text-center text-gray-600">No events yet.</li>
                    ) : events.map(ev => (
                      <li key={ev._id} className="group p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/5 transition-all">
                        <div className="min-w-0">
                          <h4 className="font-bold text-white leading-tight group-hover:text-indigo-300 transition-colors truncate">{ev.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>📅 {ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</span>
                            <span className={Number(ev.availableSeats) > 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                              🪑 {ev.availableSeats ?? 0}/{ev.totalSeats ?? 0}
                            </span>
                            <span className="text-indigo-400 font-semibold">{Number(ev.ticketPrice) === 0 ? 'Free' : `₹${ev.ticketPrice}`}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEdit(ev)} className="text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/25 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">✏️ Edit</button>
                          <button onClick={() => deleteEvent(ev._id)} className="text-red-400 hover:text-white hover:bg-red-500 border border-red-500/25 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bookings */}
              <div>
                <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-xs flex items-center justify-center font-black text-yellow-400">{safe.length}</span>
                  Booking Requests
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <ul className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                    {safe.length === 0 ? (
                      <li className="p-8 text-center text-gray-600">No bookings yet.</li>
                    ) : safe.map(b => (
                      <li key={b._id} className={cls('p-5 hover:bg-white/5 transition-all border-l-4',
                        b.status === 'pending' ? 'border-l-yellow-400' : b.status === 'confirmed' ? 'border-l-emerald-400' : b.status === 'awaiting_payment' ? 'border-l-orange-400' : 'border-l-red-400')}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-white leading-tight">{b.eventId?.title || 'Deleted Event'}</h4>
                          <div className="flex flex-col gap-1 items-end ml-3 shrink-0">
                            <Badge status={b.status} />
                            {b.status !== 'cancelled' && <Badge status={b.paymentStatus} />}
                            {b.refundStatus === 'pending' && <Badge status="refund_pending" />}
                          </div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-3 text-xs space-y-1">
                          <p className="text-gray-400"><span className="font-bold text-gray-600 uppercase mr-2">User:</span>{b.userId?.name || 'Unknown'} {b.userId?.email && <span className="text-gray-600">({b.userId.email})</span>}</p>
                          <p className="text-gray-400"><span className="font-bold text-gray-600 uppercase mr-2">Amount:</span><span className={Number(b.amount) === 0 ? 'text-emerald-400 font-bold' : 'text-white font-bold'}>{Number(b.amount) === 0 ? 'Free' : `₹${b.amount}`}</span>{b.persons > 1 && <span className="text-gray-600 ml-1">({b.persons} persons)</span>}</p>
                          <p className="text-gray-400"><span className="font-bold text-gray-600 uppercase mr-2">Booked:</span>{b.bookedAt ? new Date(b.bookedAt).toLocaleString() : '—'}</p>
                          {b.cancellationNote && <p className="text-orange-400 italic">{b.cancellationNote}</p>}
                        </div>
                        {b.status === 'pending' && (
                          <div className="flex flex-wrap gap-2">
                            {Number(b.amount) > 0 ? (
                              <button onClick={() => confirmBooking(b._id, 'not_paid')} className="flex-1 min-w-[130px] bg-indigo-500/15 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/25 text-xs font-bold py-2 px-3 rounded-lg transition-all">
                                💳 Approve → Send Payment Link
                              </button>
                            ) : (
                              <button onClick={() => confirmBooking(b._id, 'paid')} className="flex-1 min-w-[110px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/25 text-xs font-bold py-2 px-3 rounded-lg transition-all">
                                ✓ Approve Free
                              </button>
                            )}
                            <button onClick={() => rejectBooking(b._id)} className="bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/25 text-xs font-bold py-2 px-3 rounded-lg transition-all">
                              ✕ Reject
                            </button>
                          </div>
                        )}
                        {b.status === 'awaiting_payment' && Number(b.amount) > 0 && (
                          <button onClick={() => confirmBooking(b._id, 'paid')} className="w-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/25 text-xs font-bold py-2 px-3 rounded-lg transition-all">
                            ✅ Mark as Paid
                          </button>
                        )}
                        {b.refundStatus === 'pending' && (
                          <button onClick={() => processRefund(b._id)} className="w-full mt-2 bg-pink-500/15 text-pink-400 hover:bg-pink-500 hover:text-white border border-pink-500/25 text-xs font-bold py-2 px-3 rounded-lg transition-all">
                            ↩ Mark Refund Processed
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">✏️ Edit Event</h2>
              <button onClick={() => setEditingId(null)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-gray-500 transition-all">✕</button>
            </div>
            <div className="p-5">
              <EventForm data={editFormData} setData={setEditFormData} onSubmit={updateEvent} onCancel={() => setEditingId(null)} submitLabel="Save Changes" />
            </div>
          </div>
        </div>
      )}

      {/* Payment Settings Modal */}
      {showPaySettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">💳 Payment Settings</h2>
              <button onClick={() => setShowPaySettings(false)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-gray-500 transition-all">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {[['name','Receiver Name','e.g. Eventora Payments','text'],['upiId','UPI ID','yourname@upi','text'],['qrImage','QR Code Image URL (optional)','Paste image URL','text']].map(([k,l,p,t]) => (
                <div key={k}>
                  <label className="block text-sm font-bold text-gray-300 mb-1">{l}</label>
                  <input type={t} placeholder={p} value={payForm[k] || ''} onChange={e => setPayForm({ ...payForm, [k]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                </div>
              ))}
              {payForm.qrImage && <div className="flex justify-center"><img src={payForm.qrImage} alt="QR" className="w-32 h-32 object-contain border border-white/10 rounded-xl" onError={e => e.currentTarget.style.display='none'} /></div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPaySettings(false)} className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold py-3 rounded-xl transition">Cancel</button>
                <button onClick={() => { localStorage.setItem('eventora_pay', JSON.stringify(payForm)); setShowPaySettings(false); alert('Saved!'); }}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyEnquiry && <ReplyModal enquiry={replyEnquiry} onClose={() => setReplyEnquiry(null)} onSend={sendReply} />}
    </div>
  );
};

export default AdminDashboard;
