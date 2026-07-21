import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt, FaArrowRight, FaFire } from 'react-icons/fa';

const openMap = (location, e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
};

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = setTimeout(fetchEvents, 350);
        return () => clearTimeout(id);
    }, [search]);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get(`/events?search=${search}`);
            setEvents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))];
    const filtered = activeCategory === 'All' ? events : events.filter(e => e.category === activeCategory);

    return (
        <div className="flex flex-col min-h-screen">

            {/* ── Hero ── */}
            <section className="relative bg-gray-950 text-white rounded-3xl overflow-hidden mb-14 shadow-2xl">
                {/* BG image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=3000&auto=format&fit=crop')" }}
                />
                {/* Gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />

                {/* Decorative blobs */}
                <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-20 w-96 h-48 bg-white/3 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 px-8 md:px-20 py-20 md:py-28 flex flex-col items-center text-center">
                    <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-7">
                        <FaFire className="text-orange-400" /> Live Events Near You
                    </span>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
                        Find Your Next<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
                            Unforgettable
                        </span>{' '}
                        Experience
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed font-light">
                        Discover tech conferences, music festivals & workshops. Secure your spot in seconds.
                    </p>

                    {/* Search bar */}
                    <div className="w-full max-w-2xl relative group">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-base group-focus-within:text-gray-900 transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="Search events, categories, locations…"
                            className="w-full pl-14 pr-6 py-4 rounded-2xl text-base text-gray-900 bg-white shadow-2xl border-2 border-transparent focus:border-gray-300 focus:outline-none transition-all placeholder-gray-400 font-medium"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-8 mt-10 text-sm text-gray-500">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {events.length} events live</div>
                        <div className="hidden sm:block w-px h-4 bg-white/10"></div>
                        <div className="hidden sm:flex items-center gap-2"><FaShieldAlt className="text-gray-600" /> 2FA secured bookings</div>
                    </div>
                </div>
            </section>

            {/* ── Feature Pills ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
                {[
                    { icon: <FaRegClock />, title: 'Instant Booking', desc: 'Reserve your seat in under 60 seconds with OTP verification.' },
                    { icon: <FaTicketAlt />, title: 'Easy Management', desc: 'Track all your bookings from one clean personal dashboard.' },
                    { icon: <FaShieldAlt />, title: '2FA Security', desc: 'Every booking is protected with email OTP — no exceptions.' },
                ].map(f => (
                    <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-11 h-11 bg-gray-950 text-white rounded-xl flex items-center justify-center text-base shrink-0 group-hover:scale-110 transition-transform">
                            {f.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Events Section ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Upcoming Events</h2>
                    <p className="text-gray-500 text-sm mt-0.5">{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>
                </div>
            </div>

            {/* Category filter pills */}
            {categories.length > 1 && (
                <div className="flex gap-2 flex-wrap mb-7">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                                activeCategory === cat
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading events…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">🔍</div>
                    <p className="text-gray-500 font-semibold">No events found</p>
                    <p className="text-gray-400 text-sm">Try a different search or category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                    {filtered.map(event => {
                        const seatsLeft = event.availableSeats;
                        const seatsPercent = Math.round((seatsLeft / event.totalSeats) * 100);
                        const isSoldOut = seatsLeft <= 0;
                        const isLow = seatsPercent <= 20 && !isSoldOut;

                        return (
                            <div key={event._id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 flex flex-col">

                                {/* Image */}
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    {event.image ? (
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <span className="text-white/20 text-4xl font-black uppercase tracking-widest">{event.category}</span>
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                    {/* Price badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className={`text-xs font-black px-3 py-1.5 rounded-full shadow-lg ${event.ticketPrice === 0 ? 'bg-emerald-500 text-white' : 'bg-white/95 backdrop-blur-sm text-gray-900'}`}>
                                            {event.ticketPrice === 0 ? '🎉 FREE' : `₹${event.ticketPrice}`}
                                        </span>
                                    </div>

                                    {/* Sold out / Low seats overlay */}
                                    {isSoldOut && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="bg-red-500 text-white font-black text-sm px-4 py-2 rounded-full">SOLD OUT</span>
                                        </div>
                                    )}
                                    {isLow && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">🔥 Only {seatsLeft} left</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex flex-col flex-grow">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{event.category}</span>
                                    <h2 className="text-base font-bold text-gray-900 mb-3 leading-snug line-clamp-2">{event.title}</h2>

                                    <div className="space-y-2 mb-4">
                                        {/* Date */}
                                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                                            <FaCalendarAlt className="text-gray-400 shrink-0" />
                                            <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </div>

                                        {/* Location — clickable map link */}
                                        <button
                                            onClick={e => openMap(event.location, e)}
                                            className="flex items-center gap-2 text-xs text-gray-500 hover:text-rose-500 transition-colors group/loc w-full text-left"
                                        >
                                            <FaMapMarkerAlt className="text-gray-400 group-hover/loc:text-rose-500 shrink-0 transition-colors" />
                                            <span className="truncate group-hover/loc:underline underline-offset-2">{event.location}</span>
                                        </button>
                                    </div>

                                    {/* Seats bar */}
                                    <div className="mt-auto">
                                        <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1.5">
                                            <span>{isSoldOut ? 'No seats left' : `${seatsLeft} seats left`}</span>
                                            <span>{event.totalSeats} total</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${isSoldOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                style={{ width: `${seatsPercent}%` }}
                                            />
                                        </div>

                                        <Link
                                            to={`/events/${event._id}`}
                                            className="flex items-center justify-center gap-2 w-full bg-gray-950 hover:bg-black text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md group/btn"
                                        >
                                            View Details
                                            <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Footer ── */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-100 text-center">
                <div className="flex justify-center items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <FaTicketAlt className="text-white text-sm" />
                    </div>
                    <span className="text-xl font-black text-gray-900">Eventora</span>
                </div>
                <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto leading-relaxed">
                    The simplest way to discover and book world-class events in your city.
                </p>
                <p className="text-xs text-gray-300 font-medium uppercase tracking-wider">
                    © {new Date().getFullYear()} Eventora Platform · All rights reserved
                </p>
            </footer>
        </div>
    );
};

export default Home;
