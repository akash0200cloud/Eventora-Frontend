import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import {
    FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave,
    FaExternalLinkAlt, FaArrowLeft, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [persons, setPersons] = useState(1);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        api.get(`/events/${id}`)
            .then(({ data }) => setEvent(data))
            .catch(() => setError('Failed to load event.'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleBooking = async () => {
        if (!user) { navigate('/login'); return; }
        setBookingLoading(true); setError(''); setSuccessMsg('');
        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('OTP sent to your email. Enter it below to confirm.');
            } else {
                await api.post('/bookings', { eventId: event._id, otp, persons });
                setSuccessMsg('Booking requested! Awaiting admin confirmation.');
                setShowOTP(false);
                setEvent(prev => ({ ...prev, availableSeats: prev.availableSeats - persons }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setError('');
            await api.post('/bookings/send-otp');
            setSuccessMsg('OTP resent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    const openMap = () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Loading event…</p>
            </div>
        </div>
    );

    if (!event) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-gray-800">Event not found</p>
                <button onClick={() => navigate('/')} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-black transition">
                    Go Back
                </button>
            </div>
        </div>
    );

    const isSoldOut = event.availableSeats <= 0;
    const seatsPercent = Math.round((event.availableSeats / event.totalSeats) * 100);
    const seatsBarColor = seatsPercent > 50 ? 'bg-emerald-500' : seatsPercent > 20 ? 'bg-amber-400' : 'bg-red-500';
    const booked = !!(successMsg && !showOTP);

    return (
        <div className="max-w-5xl mx-auto pb-20">

            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-semibold mb-7 transition-all group text-sm"
            >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                Back to Events
            </button>

            {/* ── Hero Banner ── */}
            <div className="relative w-full h-64 sm:h-80 md:h-[420px] rounded-3xl overflow-hidden mb-8 shadow-2xl">
                {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
                        <span className="text-white/10 text-7xl font-black uppercase tracking-widest select-none">{event.category}</span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-5 left-5">
                    <span className="bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                        {event.category}
                    </span>
                </div>
                <div className="absolute top-5 right-5">
                    <span className={`text-sm font-black px-4 py-2 rounded-full shadow-xl ${event.ticketPrice === 0 ? 'bg-emerald-500 text-white' : 'bg-white text-gray-900'}`}>
                        {event.ticketPrice === 0 ? '🎉 FREE' : `₹${event.ticketPrice}`}
                    </span>
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-xl">
                        {event.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                        <FaCalendarAlt className="text-xs" />
                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* ── Body Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

                {/* Left col */}
                <div className="lg:col-span-2 space-y-6">

                    {/* About */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gray-900 rounded-full" />
                            About this Event
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-[15px]">{event.description}</p>
                    </div>

                    {/* Info cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 text-lg shrink-0">
                                <FaCalendarAlt />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date</p>
                                <p className="font-bold text-gray-900 text-sm leading-snug">
                                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Seats card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500 text-lg shrink-0">
                                    <FaChair />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Availability</p>
                                    <p className="font-bold text-gray-900 text-sm">
                                        <span className={seatsPercent <= 20 ? 'text-red-500' : seatsPercent <= 50 ? 'text-amber-500' : 'text-emerald-600'}>
                                            {event.availableSeats}
                                        </span>
                                        <span className="text-gray-400"> / {event.totalSeats} seats</span>
                                    </p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className={`${seatsBarColor} h-1.5 rounded-full transition-all`} style={{ width: `${seatsPercent}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* ── Location + Embedded Map ── */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                        {/* Header row */}
                        <div className="p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 text-lg shrink-0">
                                    <FaMapMarkerAlt />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                                    <p className="font-bold text-gray-900 text-sm truncate">{event.location}</p>
                                </div>
                            </div>
                            <button
                                onClick={openMap}
                                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                            >
                                <FaMapMarkerAlt className="text-rose-400" />
                                View on Map
                                <FaExternalLinkAlt className="opacity-60 text-[10px]" />
                            </button>
                        </div>

                        {/* Embedded map — click opens Google Maps */}
                        <div
                            className="relative h-56 sm:h-64 border-t border-gray-100 cursor-pointer group overflow-hidden"
                            onClick={openMap}
                            title="Open in Google Maps"
                        >
                            <iframe
                                title="Event Location Map"
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed&z=15`}
                                className="w-full h-full border-0 pointer-events-none"
                                loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 bg-white/95 backdrop-blur-sm text-gray-900 font-bold text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2">
                                    <FaExternalLinkAlt className="text-xs" /> Open in Google Maps
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Sticky Booking Card ── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 rounded-2xl overflow-hidden shadow-xl border border-gray-100">

                        {/* Price header */}
                        <div className="bg-gradient-to-br from-gray-950 to-gray-800 p-6 text-white">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Amount</p>
                            <p className="text-5xl font-black leading-none mb-1">
                                {event.ticketPrice === 0
                                    ? <span className="text-emerald-400">FREE</span>
                                    : <span>₹{event.ticketPrice * persons}</span>
                                }
                            </p>
                            {event.ticketPrice > 0 && (
                                <p className="text-gray-500 text-xs">
                                    {persons > 1 ? `₹${event.ticketPrice} × ${persons} persons` : 'per person · pay via UPI after approval'}
                                </p>
                            )}
                        </div>

                        <div className="bg-white p-5 space-y-3">
                            {/* Info chips */}
                            <div className={`flex items-center gap-3 text-sm rounded-xl px-4 py-3 font-semibold ${isSoldOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                <FaChair className="shrink-0" />
                                {isSoldOut ? 'Sold Out — No seats available' : `${event.availableSeats} seats remaining`}
                            </div>

                            {/* Persons selector */}
                            {!isSoldOut && !booked && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wider">Number of Persons</span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setPersons(p => Math.max(1, p - 1))}
                                                disabled={persons <= 1}
                                                className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-black text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                            >−</button>
                                            <span className="text-xl font-black text-gray-900 w-6 text-center">{persons}</span>
                                            <button
                                                onClick={() => setPersons(p => Math.min(event.availableSeats, p + 1))}
                                                disabled={persons >= event.availableSeats}
                                                className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-black text-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                            >+</button>
                                        </div>
                                    </div>
                                    {event.ticketPrice > 0 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                            <span className="text-xs text-gray-400">₹{event.ticketPrice} × {persons} person{persons > 1 ? 's' : ''}</span>
                                            <span className="text-base font-black text-gray-900">₹{event.ticketPrice * persons}</span>
                                        </div>
                                    )}
                                    {event.ticketPrice === 0 && (
                                        <p className="text-xs text-emerald-600 font-semibold pt-1 border-t border-gray-200">Free for all {persons} person{persons > 1 ? 's' : ''} 🎉</p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                                <FaMoneyBillWave className="text-gray-400 shrink-0" />
                                {event.ticketPrice === 0 ? 'No payment required' : 'Admin approves → you pay via UPI'}
                            </div>

                            {/* OTP input */}
                            {showOTP && (
                                <div className="space-y-2 pt-1">
                                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">Enter OTP</label>
                                    <input
                                        type="text"
                                        placeholder="• • • • • •"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition font-black tracking-[0.5em] text-center text-xl"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        maxLength="6"
                                        autoFocus
                                    />
                                    <button onClick={handleResendOTP} className="text-xs text-gray-400 hover:text-gray-900 font-semibold transition w-full text-center">
                                        Didn't receive it? Resend OTP
                                    </button>
                                </div>
                            )}

                            {/* CTA Button */}
                            <button
                                onClick={handleBooking}
                                disabled={isSoldOut || bookingLoading || booked || (showOTP && !otp)}
                                className={`w-full py-4 rounded-xl font-black text-sm tracking-wide transition-all ${
                                    isSoldOut || booked
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-950 hover:bg-black text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                            >
                                {bookingLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Processing…
                                    </span>
                                ) : booked ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaCheckCircle className="text-emerald-400" /> Request Sent
                                    </span>
                                ) : showOTP ? 'Verify OTP & Confirm'
                                  : isSoldOut ? 'Sold Out'
                                  : 'Confirm Registration'}
                            </button>

                            {/* Messages */}
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3 rounded-xl text-center">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold p-3 rounded-xl text-center">
                                    {successMsg}
                                </div>
                            )}

                            {/* Security badge */}
                            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                                <FaShieldAlt />
                                <span>Protected by 2FA OTP verification</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
