import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaQrcode, FaCheckCircle } from 'react-icons/fa';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRazorpayPayment = async () => {
        setLoading(true);
        setError('');
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
                        onSuccess();
                        onClose();
                    } catch (err) {
                        setError('Payment verification failed. Contact support.');
                    }
                },
                prefill: { email: booking.userId?.email || '' },
                theme: { color: '#111827' },
                modal: { ondismiss: () => setLoading(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl">✕</button>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaQrcode className="text-blue-500 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Complete Payment</h2>
                    <p className="text-gray-500 text-sm">{booking.eventId?.title}</p>
                    <p className="text-4xl font-black text-gray-900 mt-3">₹{booking.amount}</p>
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <button
                    onClick={handleRazorpayPayment}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                    {loading ? 'Processing...' : `Pay ₹${booking.amount} via Razorpay`}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">Secured by Razorpay</p>
            </div>
        </div>
    );
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
        } finally {
            setLoading(false);
        }
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

    if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            {paymentBooking && (
                <PaymentModal
                    booking={paymentBooking}
                    onClose={() => setPaymentBooking(null)}
                    onSuccess={fetchBookings}
                />
            )}

            <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-8 border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-20 h-20 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center text-3xl font-bold uppercase tracking-widest shrink-0">
                    {user?.name.charAt(0)}
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
                    <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> User Dashboard
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
                    <FaTicketAlt className="text-gray-700" /> My Booking Requests
                </h2>
            </div>

            {bookings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTicketAlt className="text-gray-300 text-3xl" />
                    </div>
                    <p className="text-xl text-gray-500 mb-6 mt-4 font-medium">You haven't booked any events yet.</p>
                    <Link to="/" className="inline-block bg-gray-900 hover:bg-black text-white font-bold py-3 px-8 rounded-lg transition shadow-md">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col">
                            <div className="p-6 border-b border-gray-50 flex-grow">
                                {booking.eventId ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{booking.eventId.title}</h3>
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    booking.status === 'awaiting_payment' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                    {booking.status === 'awaiting_payment' ? 'Awaiting Payment' : booking.status}
                                                </span>
                                                {booking.status !== 'cancelled' && (
                                                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                        booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {booking.paymentStatus.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 mb-4 space-y-1">
                                            <p><strong className="text-gray-700">Date:</strong> {new Date(booking.eventId.date).toLocaleDateString()}</p>
                                            <p><strong className="text-gray-700">Amount:</strong> {booking.amount === 0 ? 'Free' : `₹${booking.amount}`}{booking.persons > 1 ? ` (${booking.persons} persons)` : ''}</p>
                                            <p><strong className="text-gray-700">Requested:</strong> {new Date(booking.bookedAt).toLocaleDateString()}</p>
                                        </div>

                                        {/* Pay Now button — show when confirmed + not paid + amount > 0 */}
                                        {(booking.status === 'awaiting_payment' || (booking.status === 'confirmed' && booking.paymentStatus === 'not_paid')) && booking.amount > 0 && (
                                            <button
                                                onClick={() => setPaymentBooking(booking)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2 mt-2"
                                            >
                                                <FaQrcode /> Pay Now ₹{booking.amount}
                                            </button>
                                        )}

                                        {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                                            <div className="w-full bg-green-50 text-green-700 font-bold py-2.5 rounded-lg text-center text-sm border border-green-200 mt-2 flex items-center justify-center gap-2">
                                                <FaCheckCircle /> Payment Done
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-red-500 italic">Event details unavailable</p>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 flex justify-between items-center shrink-0">
                                {booking.eventId && booking.status !== 'cancelled' ? (
                                    <>
                                        <Link to={`/events/${booking.eventId._id}`} className="text-gray-900 font-semibold text-sm hover:underline">View Event</Link>
                                        {booking.status !== 'confirmed' && (
                                            <button
                                                onClick={() => cancelBooking(booking._id)}
                                                className="text-red-500 font-semibold text-sm hover:text-red-700 transition flex items-center gap-1"
                                            >
                                                <FaTimesCircle /> Cancel
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full text-center text-sm text-gray-500 italic">Booking Cancelled</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
