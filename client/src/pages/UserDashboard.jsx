import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaQrcode, FaCheckCircle, FaCalendarAlt, FaRupeeSign, FaClock } from 'react-icons/fa';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [paid, setPaid] = useState(false);

    const handleRazorpayPayment = async () => {
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/payment/create-order', { bookingId: booking._id });
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'Eventora',
                description: booking.eventId?.title,
                order_id: data.orderId,
                handler: async (response) => {
                    try {
                        await api.post('/payment/verify', {
                            bookingId: booking._id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        setPaid(true);
                        onSuccess();
                        setTimeout(() => onClose(), 2500);
                    } catch { setError('Payment verification failed. Contact support.'); }
                },
                prefill: { email: booking.userId?.email || '' },
                theme: { color: '#111827' },
                notes: { upi_id: data.upiId },
                modal: { ondismiss: () => setLoading(false) }
            };
            new window.Razorpay(options).open();
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally { setLoading(false); }
    };

    if (paid) return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-bounce-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">✅</div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 text-sm mb-1">Your booking is now confirmed.</p>
                <p className="text-gray-400 text-xs">A confirmation email has been sent to you.</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all duration-200 hover:scale-110">✕</button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-transform duration-300 hover:scale-110">
                        <FaQrcode className="text-blue-500 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Complete Payment</h2>
                    <p className="text-gray-500 text-sm">{booking.eventId?.title}</p>
                    <p className="text-4xl font-black text-gray-900 mt-3">₹{booking.amount}</p>
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-xl">{error}</p>}
                <button
                    onClick={handleRazorpayPayment}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing...</> : `Pay ₹${booking.amount} via Razorpay`}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">🔒 Secured by Razorpay</p>
            </div>
        </div>
    );
};

const statusConfig = {
    confirmed:        { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Confirmed' },
    pending:          { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    cancelled:        { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled' },
    awaiting_payment: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Awaiting Payment' },
};

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentBooking, setPaymentBooking] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings', error);
        } finally { setLoading(false); }
    };

    const cancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await api.delete(`/bookings/${id}`);
                fetchBookings();
            } catch (error) {
                alert(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
    );

    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending   = bookings.filter(b => b.status === 'pending').length;
    const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);

    return (
        <div className="max-w-6xl mx-auto">
            {paymentBooking && (
                <PaymentModal booking={paymentBooking} onClose={() => setPaymentBooking(null)} onSuccess={fetchBookings} />
            )}

            {/* ── Profile Header ── */}
            <div className="group bg-white rounded-3xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 animate-fade-down delay-0">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-950 text-white rounded-2xl flex items-center justify-center text-3xl font-black uppercase shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Welcome back, {user?.name}!</h1>
                    <p className="text-gray-500 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active User Dashboard
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{user?.email}</p>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Bookings', value: bookings.length, icon: <FaTicketAlt />, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100', delay: 'delay-100' },
                    { label: 'Confirmed',      value: confirmed,       icon: <FaCheckCircle />, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100', delay: 'delay-200' },
                    { label: 'Total Spent',    value: `₹${totalSpent}`, icon: <FaRupeeSign />, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100', delay: 'delay-300' },
                ].map(s => (
                    <div key={s.label} className={`group ${s.color} rounded-2xl p-5 flex items-center justify-between border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default animate-fade-up ${s.delay}`}>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{s.label}</p>
                            <p className="text-3xl font-black">{s.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300`}>
                            {s.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Bookings Header ── */}
            <div className="flex items-center justify-between mb-6 animate-fade-left delay-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <FaTicketAlt className="text-gray-600" /> My Booking Requests
                    {pending > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                            {pending} pending
                        </span>
                    )}
                </h2>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100 hover:shadow-md transition-all duration-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🎟️</div>
                    <p className="text-xl text-gray-500 mb-6 font-medium">No bookings yet</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking, idx) => {
                        const sc = statusConfig[booking.status] || statusConfig.pending;
                        const canPay = (booking.status === 'awaiting_payment' || (booking.status === 'confirmed' && booking.paymentStatus === 'not_paid')) && booking.amount > 0;
                        const isPaid = booking.status === 'confirmed' && booking.paymentStatus === 'paid';
                        const delays = ['delay-0','delay-100','delay-200','delay-300','delay-400','delay-500'];

                        return (
                            <div key={booking._id} className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-gray-100 hover:border-indigo-100 transition-all duration-300 hover:-translate-y-2 flex flex-col animate-slide-card ${delays[idx % delays.length]}`}>

                                {/* Color top bar based on status */}
                                <div className={`h-1.5 w-full ${
                                    booking.status === 'confirmed' ? 'bg-green-400' :
                                    booking.status === 'cancelled' ? 'bg-red-400' :
                                    booking.status === 'awaiting_payment' ? 'bg-orange-400' : 'bg-yellow-400'
                                }`} />

                                <div className="p-5 flex-grow">
                                    {booking.eventId ? (
                                        <>
                                            {/* Title + badges */}
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors line-clamp-2">
                                                    {booking.eventId.title}
                                                </h3>
                                                <div className="flex flex-col gap-1 items-end shrink-0">
                                                    <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${sc.bg} ${sc.text} transition-all duration-200 group-hover:scale-105`}>
                                                        {sc.label}
                                                    </span>
                                                    {booking.status !== 'cancelled' && (
                                                        <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all duration-200 group-hover:scale-105 ${
                                                            booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {booking.paymentStatus.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <FaCalendarAlt className="text-gray-400 shrink-0" />
                                                    {new Date(booking.eventId.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <FaRupeeSign className="text-gray-400 shrink-0" />
                                                    {booking.amount === 0 ? <span className="text-green-600 font-bold">Free</span> : <span className="font-bold text-gray-800">₹{booking.amount}</span>}
                                                    {booking.persons > 1 && <span className="text-gray-400">({booking.persons} persons)</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <FaClock className="shrink-0" />
                                                    Requested {new Date(booking.bookedAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* Pay Now */}
                                            {canPay && (
                                                <button
                                                    onClick={() => setPaymentBooking(booking)}
                                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm mt-1"
                                                >
                                                    <FaQrcode /> Pay Now ₹{booking.amount}
                                                </button>
                                            )}

                                            {/* Paid badge */}
                                            {isPaid && (
                                                <div className="w-full bg-green-50 text-green-700 font-bold py-2.5 rounded-xl text-center text-sm border border-green-200 mt-1 flex items-center justify-center gap-2 hover:bg-green-100 transition-colors duration-200">
                                                    <FaCheckCircle /> Payment Done ✓
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-red-400 italic text-sm">Event details unavailable</p>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-gray-100 transition-colors duration-200">
                                    {booking.eventId && booking.status !== 'cancelled' ? (
                                        <>
                                            <Link
                                                to={`/events/${booking.eventId._id}`}
                                                className="text-gray-700 font-semibold text-sm hover:text-gray-900 hover:underline underline-offset-2 transition-colors"
                                            >
                                                View Event →
                                            </Link>
                                            {booking.status !== 'confirmed' && (
                                                <button
                                                    onClick={() => cancelBooking(booking._id)}
                                                    className="text-red-400 font-semibold text-sm hover:text-red-600 transition-all duration-200 flex items-center gap-1 hover:scale-105"
                                                >
                                                    <FaTimesCircle /> Cancel
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-sm text-gray-400 italic">Booking Cancelled</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
