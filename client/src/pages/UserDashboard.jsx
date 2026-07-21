import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaTicketAlt, FaTimesCircle, FaQrcode, FaCheckCircle } from 'react-icons/fa';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
    const [step, setStep] = useState('qr'); // qr -> scanning -> confirm -> otp -> done
    const [txnId, setTxnId] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const settings = JSON.parse(localStorage.getItem('eventora_payment_settings') || '{"upiId":"9431585217-3@ybl","name":"Eventora Payments","qrImage":""}');
    const paymentDetails = booking.paymentDetails || {};
    const upiId = paymentDetails.upiId || settings.upiId || '9431585217-3@ybl';
    const receiverName = paymentDetails.upiName || settings.name || 'Eventora Payments';
    const qrImage = settings.qrImage || '';
    const amount = booking.amount;
    const eventTitle = booking.eventId?.title;

    // Real UPI deep link — scannable by PhonePe, GPay, Paytm etc.
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(receiverName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Eventora: ' + eventTitle)}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}`;

    const handleScanQR = () => {
        setStep('scanning');
        setScanProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 4;
            setScanProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => setStep('confirm'), 400);
            }
        }, 60);
    };

    const handleRequestOTP = async () => {
        if (!txnId.trim()) { setError('Please enter Transaction ID'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post(`/bookings/${booking._id}/pay-otp`);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!otp.trim()) { setError('Please enter OTP'); return; }
        setLoading(true);
        setError('');
        try {
            await api.put(`/bookings/${booking._id}/pay`, { txnId, otp });
            setStep('done');
            setTimeout(() => { onSuccess(); onClose(); }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment confirmation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl">✕</button>

                {step === 'qr' && (
                    <>
                        <div className="text-center mb-5">
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Complete Payment</h2>
                            <p className="text-gray-500 text-sm">{eventTitle}</p>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-4 mb-4 text-center">
                            <p className="text-white text-sm mb-1 font-medium">{receiverName}</p>
                            <p className="text-4xl font-black text-white mb-1">₹{amount}</p>
                            <p className="text-gray-300 text-xs">Scan QR or pay to UPI ID below</p>
                        </div>

                        <div className="flex flex-col items-center mb-4">
                            <div className="relative bg-white border-4 border-gray-900 rounded-xl p-3 mb-3 shadow-md">
                                {qrImage ? (
                                    <img src={qrImage} alt="UPI QR" className="w-44 h-44 object-contain" />
                                ) : (
                                    <img src={qrApiUrl} alt="UPI QR" className="w-44 h-44 object-contain" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white rounded-full p-1 shadow">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/200px-Paytm_Logo_%28standalone%29.svg.png" alt="" className="w-6 h-6 object-contain opacity-0" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">Scan with PhonePe / GPay / Paytm / Any UPI App</p>
                            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold tracking-wider font-mono select-all">
                                {upiId}
                            </div>
                        </div>

                        <a
                            href={upiLink}
                            className="w-full mb-3 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                        >
                            📱 Open UPI App Directly
                        </a>
                        <button onClick={handleScanQR} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition shadow-md flex items-center justify-center gap-2">
                            <FaQrcode /> I Have Paid → Confirm
                        </button>
                    </>
                )}

                {step === 'scanning' && (
                    <div className="text-center py-2">
                        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Scanning QR Code…</h2>
                        <p className="text-gray-400 text-sm mb-5">Hold your phone steady over the QR code</p>

                        {/* Phone frame */}
                        <div className="relative mx-auto w-48 h-80 bg-gray-950 rounded-[2.5rem] shadow-2xl border-4 border-gray-800 flex flex-col items-center justify-start overflow-hidden mb-5">
                            {/* Phone notch */}
                            <div className="w-20 h-5 bg-gray-800 rounded-b-2xl mt-1 z-10"></div>

                            {/* Camera viewfinder area */}
                            <div className="relative w-36 h-36 mt-4 rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
                                {/* Dark viewfinder bg with subtle grid */}
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                    backgroundSize: '12px 12px'
                                }}></div>

                                {/* QR code image inside viewfinder */}
                                <img
                                    src={qrApiUrl}
                                    alt="QR"
                                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                                />

                                {/* Corner brackets */}
                                {[['top-1 left-1','border-t-2 border-l-2'],['top-1 right-1','border-t-2 border-r-2'],['bottom-1 left-1','border-b-2 border-l-2'],['bottom-1 right-1','border-b-2 border-r-2']].map(([pos, border], i) => (
                                    <div key={i} className={`absolute ${pos} w-5 h-5 ${border} border-green-400 rounded-sm`}></div>
                                ))}

                                {/* Laser scan line */}
                                <div
                                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]"
                                    style={{
                                        top: `${scanProgress}%`,
                                        transition: 'top 0.1s linear'
                                    }}
                                ></div>

                                {/* Done overlay */}
                                {scanProgress >= 100 && (
                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                            <FaCheckCircle className="text-white text-xl" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Phone bottom status */}
                            <div className="mt-4 px-3 w-full">
                                <div className="bg-gray-800 rounded-xl px-3 py-2 text-center">
                                    <p className="text-green-400 text-[10px] font-bold tracking-wider">
                                        {scanProgress < 30 ? 'DETECTING QR…' : scanProgress < 60 ? 'READING DATA…' : scanProgress < 90 ? 'VERIFYING…' : 'CONFIRMED ✓'}
                                    </p>
                                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1.5">
                                        <div className="bg-green-400 h-1 rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Home bar */}
                            <div className="absolute bottom-2 w-16 h-1 bg-gray-600 rounded-full"></div>
                        </div>

                        {/* Step checklist */}
                        <div className="space-y-1.5 text-sm text-left inline-block">
                            {[
                                [30, 'UPI ID verified'],
                                [60, 'Transaction found'],
                                [90, 'Amount matched'],
                            ].map(([threshold, label]) => (
                                <div key={label} className={`flex items-center gap-2 transition-all ${scanProgress >= threshold ? 'text-green-600' : 'text-gray-300'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                        scanProgress >= threshold ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                    }`}>
                                        {scanProgress >= threshold && <span className="text-white text-[8px] font-black">✓</span>}
                                    </div>
                                    <span className="font-semibold">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FaCheckCircle className="text-green-500 text-3xl" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Payment Detected!</h2>
                            <p className="text-gray-500 text-sm">Enter your Transaction ID to receive OTP</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID / UTR Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 123456789012"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-700 transition font-mono text-lg"
                                value={txnId}
                                onChange={(e) => setTxnId(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setStep('qr')} className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition">Back</button>
                            <button onClick={handleRequestOTP} disabled={loading} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-md">
                                {loading ? 'Sending OTP...' : 'Get OTP →'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-blue-500 text-3xl">📧</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Verify Payment</h2>
                            <p className="text-gray-500 text-sm">OTP sent to your registered email</p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                            <input
                                type="text"
                                placeholder="6-digit OTP"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gray-700 transition font-mono text-lg text-center tracking-widest"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => { setStep('confirm'); setError(''); }} className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition">Back</button>
                            <button onClick={handleConfirmPayment} disabled={loading} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-md">
                                {loading ? 'Confirming...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'done' && (
                    <div className="text-center py-8">
                        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Submitted!</h2>
                        <p className="text-gray-500">Admin will verify and confirm your booking.</p>
                    </div>
                )}
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
