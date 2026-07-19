import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const PaymentHistory = ({ bookings }) => {
    const [filter, setFilter] = useState('all'); // all | paid | not_paid | free
    const [search, setSearch] = useState('');

    const filtered = bookings.filter(b => {
        const matchSearch = search === '' ||
            b.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            b.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
            b.eventId?.title?.toLowerCase().includes(search.toLowerCase()) ||
            b.txnId?.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === 'all' ||
            (filter === 'paid' && b.paymentStatus === 'paid') ||
            (filter === 'not_paid' && b.paymentStatus === 'not_paid' && b.status === 'confirmed') ||
            (filter === 'free' && b.amount === 0);
        return matchSearch && matchFilter;
    });

    const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);
    const pendingAmount = bookings.filter(b => b.paymentStatus === 'not_paid' && b.status === 'confirmed' && b.amount > 0).reduce((s, b) => s + b.amount, 0);

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</p>
                        <p className="text-3xl font-black text-green-700">₹{totalRevenue}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-xl">✅</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-yellow-700 text-xs font-bold uppercase tracking-wider mb-1">Pending Collection</p>
                        <p className="text-3xl font-black text-yellow-700">₹{pendingAmount}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center text-xl">⏳</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">Total Transactions</p>
                        <p className="text-3xl font-black text-blue-700">{bookings.filter(b => b.paymentStatus === 'paid').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-xl">💳</div>
                </div>
            </div>

            {/* Filters + Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <input
                    type="text"
                    placeholder="Search by user, event, or transaction ID..."
                    className="flex-1 border px-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-gray-700 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-2">
                    {['all', 'paid', 'not_paid', 'free'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition ${
                                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            {f === 'all' ? 'All' : f === 'paid' ? '✅ Paid' : f === 'not_paid' ? '⏳ Pending' : '🆓 Free'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">#</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">User</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Event</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Amount</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Txn ID</th>
                                <th className="text-left px-5 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-12 text-gray-400">No records found.</td></tr>
                            ) : filtered.map((b, i) => (
                                <tr key={b._id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-4 text-gray-400 font-mono text-xs">{i + 1}</td>
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-gray-900">{b.userId?.name}</p>
                                        <p className="text-gray-400 text-xs">{b.userId?.email}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-800 max-w-[160px] truncate">{b.eventId?.title || 'Deleted Event'}</p>
                                        <p className="text-gray-400 text-xs">{b.eventId ? new Date(b.eventId.date).toLocaleDateString() : ''}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`font-black text-base ${b.amount === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {b.amount === 0 ? 'Free' : `₹${b.amount}`}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase w-fit ${
                                                b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{b.status}</span>
                                            <span className={`px-2 py-1 text-[10px] font-black rounded uppercase w-fit ${
                                                b.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                                            }`}>{b.paymentStatus.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {b.txnId ? (
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 select-all">{b.txnId}</span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">{new Date(b.bookedAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length > 0 && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 font-medium">
                        Showing {filtered.length} of {bookings.length} records
                        {filter === 'paid' && <span className="ml-3 text-green-600 font-bold">Total: ₹{filtered.reduce((s, b) => s + b.amount, 0)}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showEventForm, setShowEventForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });
    const [editingEvent, setEditingEvent] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [paymentSettings, setPaymentSettings] = useState(() => {
        const saved = localStorage.getItem('eventora_payment_settings');
        return saved ? JSON.parse(saved) : { upiId: '9431585217-3@ybl', qrImage: '', name: 'Eventora Payments' };
    });
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);
    const [paySettingsForm, setPaySettingsForm] = useState(paymentSettings);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | history

    const handleSavePaymentSettings = () => {
        localStorage.setItem('eventora_payment_settings', JSON.stringify(paySettingsForm));
        setPaymentSettings(paySettingsForm);
        setShowPaymentSettings(false);
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [eventsRes, bookingsRes] = await Promise.all([
                api.get('/events'),
                api.get('/bookings/my') // Admin gets all bookings
            ]);
            setEvents(eventsRes.data);
            setBookings(bookingsRes.data);
        } catch (error) {
            console.error('Error fetching admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', formData);
            setShowEventForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating event');
        }
    };

    const handleEditClick = (event) => {
        setEditingEvent(event._id);
        setEditFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date).toISOString().split('T')[0],
            location: event.location,
            category: event.category,
            totalSeats: event.totalSeats,
            ticketPrice: event.ticketPrice,
            image: event.image || ''
        });
    };

    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/events/${editingEvent}`, editFormData);
            setEditingEvent(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating event');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                fetchData();
            } catch (error) {
                alert('Error deleting event');
            }
        }
    };

    const handleConfirmBooking = async (id, paymentStatus) => {
        try {
            await api.put(`/bookings/${id}/confirm`, { paymentStatus });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error confirming booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this user\'s booking request?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading admin panel...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Manage events and manually confirm bookings.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={() => { setShowPaymentSettings(true); setPaySettingsForm(paymentSettings); }}
                        className="w-full sm:w-auto bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition shadow-md"
                    >
                        💳 Payment Settings
                    </button>
                    <button
                        onClick={() => setShowEventForm(!showEventForm)}
                        className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
                    >
                        {showEventForm ? 'Cancel Creation' : '+ Create New Event'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition ${activeTab === 'dashboard' ? 'bg-white border border-b-white border-gray-200 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>📋 Dashboard</button>
                <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition ${activeTab === 'history' ? 'bg-white border border-b-white border-gray-200 text-gray-900 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
                    💳 Payment History
                    {bookings.filter(b => b.paymentStatus === 'paid').length > 0 && (
                        <span className="ml-2 bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{bookings.filter(b => b.paymentStatus === 'paid').length}</span>
                    )}
                </button>
            </div>

            {activeTab === 'history' && <PaymentHistory bookings={bookings} />}
            {activeTab === 'dashboard' && <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-green-600">₹{bookings.reduce((sum, b) => b.paymentStatus === 'paid' && b.status === 'confirmed' ? sum + b.amount : sum, 0)}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-xl font-bold">₹</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Paid Clients</p>
                        <h3 className="text-3xl font-black text-blue-600">{new Set(bookings.filter(b => b.paymentStatus === 'paid' && b.status === 'confirmed').map(b => b.userId?._id)).size}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">👤</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Pending Requests</p>
                        <h3 className="text-3xl font-black text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</h3>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl font-bold">⏳</div>
                </div>
            </div>

            {showEventForm && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animation-slideDown">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Event</h2>
                    <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input required type="text" placeholder="Event Title" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        <input required type="text" placeholder="Category (e.g., Tech, Music)" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                        <input required type="date" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                        <input required type="text" placeholder="Location" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        <input required type="number" placeholder="Total Seats" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.totalSeats} onChange={e => setFormData({ ...formData, totalSeats: e.target.value })} />
                        <input required type="number" placeholder="Ticket Price (0 for free)" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: e.target.value })} />

                        <div className="md:col-span-2">
                            <input type="text" placeholder="Image URL (Provide any direct link to an image)" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                        </div>

                        <textarea required placeholder="Event Description" className="border px-4 py-3 rounded-lg md:col-span-2 h-32 focus:ring-2 focus:ring-gray-700 outline-none transition" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        <button type="submit" className="md:col-span-2 bg-gray-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-black transition shadow-md">Publish Event</button>
                    </form>
                </div>
            )}

            {/* Payment Settings Modal */}
            {showPaymentSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">💳 Payment Settings</h2>
                            <button onClick={() => setShowPaymentSettings(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Receiver Name</label>
                                <input type="text" placeholder="e.g. Eventora Payments" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={paySettingsForm.name} onChange={e => setPaySettingsForm({ ...paySettingsForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">UPI ID</label>
                                <input type="text" placeholder="e.g. yourname@upi" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition font-mono" value={paySettingsForm.upiId} onChange={e => setPaySettingsForm({ ...paySettingsForm, upiId: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">QR Code Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input type="text" placeholder="Paste direct image URL of your UPI QR" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={paySettingsForm.qrImage} onChange={e => setPaySettingsForm({ ...paySettingsForm, qrImage: e.target.value })} />
                                <p className="text-xs text-gray-400 mt-1">If left empty, a dummy QR will be shown to users.</p>
                            </div>
                            {paySettingsForm.qrImage && (
                                <div className="flex justify-center">
                                    <img src={paySettingsForm.qrImage} alt="QR Preview" className="w-32 h-32 object-contain border rounded-xl" onError={e => e.target.style.display='none'} />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowPaymentSettings(false)} className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button onClick={handleSavePaymentSettings} className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition">Save Settings</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
                            <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateEvent} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required type="text" placeholder="Event Title" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                            <input required type="text" placeholder="Category" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })} />
                            <input required type="date" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} />
                            <input required type="text" placeholder="Location" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} />
                            <input required type="number" placeholder="Total Seats" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.totalSeats} onChange={e => setEditFormData({ ...editFormData, totalSeats: e.target.value })} />
                            <input required type="number" placeholder="Ticket Price" className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.ticketPrice} onChange={e => setEditFormData({ ...editFormData, ticketPrice: e.target.value })} />
                            <div className="md:col-span-2">
                                <input type="text" placeholder="Image URL" className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.image} onChange={e => setEditFormData({ ...editFormData, image: e.target.value })} />
                            </div>
                            <textarea required placeholder="Event Description" className="border px-4 py-3 rounded-lg md:col-span-2 h-28 focus:ring-2 focus:ring-gray-700 outline-none transition" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                            <div className="md:col-span-2 flex gap-3">
                                <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Events Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">{events.length}</span>
                        All Events
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {events.length === 0 ? <li className="p-6 text-gray-500 text-center">No events created yet.</li> :
                                events.map(event => (
                                    <li key={event._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">{event.title}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1 font-medium"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {new Date(event.date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1 font-medium"><div className={`w-2 h-2 rounded-full ${event.availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div> {event.availableSeats}/{event.totalSeats} seats</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                            <button onClick={() => handleEditClick(event)} className="flex-1 sm:flex-none text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteEvent(event._id)} className="flex-1 sm:flex-none text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>

                {/* Bookings Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">{bookings.length}</span>
                        Booking Requests
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {bookings.length === 0 ? <li className="p-6 text-gray-500 text-center">No bookings yet.</li> :
                                bookings.map(booking => (
                                    <li key={booking._id} className={`p-6 hover:bg-gray-50 transition border-l-4 ${booking.status === 'pending' ? 'border-l-yellow-400' : booking.status === 'confirmed' ? 'border-l-green-400' : 'border-l-red-400'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{booking.eventId?.title || 'Deleted Event'}</h4>
                                            <div className="flex flex-col gap-1 items-end shrink-0 ml-4">
                                                <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span>
                                                {booking.status !== 'cancelled' && <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${booking.paymentStatus === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-800'}`}>{booking.paymentStatus.replace('_', ' ')}</span>}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">User:</span>
                                                <span className="font-semibold">{booking.userId?.name}</span>
                                                <span className="text-gray-400">({booking.userId?.email})</span>
                                            </p>
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">Amount:</span>
                                                <span className={`font-semibold ${booking.amount === 0 ? 'text-green-600' : ''}`}>{booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</span>
                                            </p>
                                            <p className="text-gray-700 flex items-center gap-2 mb-1">
                                                <span className="font-bold w-16 text-gray-500 uppercase text-xs">Date:</span>
                                                <span>{new Date(booking.bookedAt).toLocaleString()}</span>
                                            </p>
                                            {booking.eventId && (
                                                <p className="text-gray-700 flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">Seats:</span>
                                                    <span className={`font-bold ${booking.eventId.availableSeats > 0 ? 'text-green-600' : 'text-red-500'}`}>{booking.eventId.availableSeats}</span> remaining of {booking.eventId.totalSeats}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons for admin */}
                                        {booking.status === 'pending' && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <button onClick={() => handleConfirmBooking(booking._id, 'paid')} className="flex-1 min-w-[120px] bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve as Paid
                                                </button>
                                                <button onClick={() => handleConfirmBooking(booking._id, 'not_paid')} className="flex-1 min-w-[120px] bg-gray-50 text-gray-700 hover:bg-gray-800 hover:text-white border border-gray-200 text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition">
                                                    ✓ Approve Undecided
                                                </button>
                                                <button onClick={() => handleCancelBooking(booking._id)} className="w-[80px] bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 text-xs font-bold py-2.5 px-3 rounded-lg transition">
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
            </div>
            </>}
        </div>
    );
};

export default AdminDashboard;
