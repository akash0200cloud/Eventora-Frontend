import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt, FaArrowRight, FaFire } from 'react-icons/fa';

const openMap = (location, e) => {
    e.preventDefault(); e.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank');
};

/* Intersection Observer hook — triggers animation when element enters viewport */
const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, visible];
};

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    const [featRef, featVisible]     = useInView();
    const [eventsRef, eventsVisible] = useInView();

    useEffect(() => {
        const id = setTimeout(fetchEvents, 350);
        return () => clearTimeout(id);
    }, [search]);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get(`/events?search=${search}`);
            setEvents(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const categories = ['All', ...new Set(events.map(e => e.category).filter(Boolean))];
    const filtered = activeCategory === 'All' ? events : events.filter(e => e.category === activeCategory);

    return (
        <div className="flex flex-col min-h-screen">

            {/* ── Hero ── */}
            <section className="relative bg-gray-950 text-white rounded-3xl overflow-hidden mb-14 shadow-2xl">
                <div className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=3000&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                <div className="absolute top-10 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none animate-float" />
                <div className="absolute bottom-0 left-20 w-96 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 px-8 md:px-20 py-20 md:py-28 flex flex-col items-center text-center">
                    <span className="animate-fade-down delay-0 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-7">
                        <FaFire className="text-orange-400 animate-pulse" /> Live Events Near You
                    </span>

                    <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl font-black mb-6 leading-[1.05] tracking-tight">
                        Find Your Next<br />
                        <span className="text-shimmer">Unforgettable</span>{' '}
                        Experience
                    </h1>

                    <p className="animate-fade-up delay-200 text-gray-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed font-light">
                        Discover tech conferences, music festivals & workshops. Secure your spot in seconds.
                    </p>

                    <div className="animate-fade-up delay-300 w-full max-w-2xl relative group">
                        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-base group-focus-within:text-indigo-500 transition-colors z-10" />
                        <input
                            type="text"
                            placeholder="Search events, categories, locations…"
                            className="w-full pl-14 pr-6 py-4 rounded-2xl text-base text-gray-900 bg-white shadow-2xl border-2 border-transparent focus:border-indigo-400 focus:outline-none transition-all placeholder-gray-400 font-medium focus:shadow-indigo-100"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="animate-fade-up delay-400 flex items-center gap-8 mt-10 text-sm text-gray-500">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {events.length} events live</div>
                        <div className="hidden sm:block w-px h-4 bg-white/10" />
                        <div className="hidden sm:flex items-center gap-2"><FaShieldAlt className="text-gray-600" /> 2FA secured bookings</div>
                    </div>
                </div>
            </section>

            {/* ── Feature Pills ── */}
            <div ref={featRef} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
                {[
                    { icon: <FaRegClock />, title: 'Instant Booking', desc: 'Reserve your seat in under 60 seconds with OTP verification.', delay: 'delay-0' },
                    { icon: <FaTicketAlt />, title: 'Easy Management', desc: 'Track all your bookings from one clean personal dashboard.', delay: 'delay-150' },
                    { icon: <FaShieldAlt />, title: '2FA Security', desc: 'Every booking is protected with email OTP — no exceptions.', delay: 'delay-300' },
                ].map((f, i) => (
                    <div key={f.title}
                        className={`group bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm cursor-default
                            hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-300 hover-glow
                            ${featVisible ? `animate-fade-up ${f.delay}` : 'opacity-0'}`}>
                        <div className="w-11 h-11 bg-gray-950 text-white rounded-xl flex items-center justify-center text-base shrink-0 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-indigo-600 transition-all duration-300">
                            {f.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors duration-200">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Events Section ── */}
            <div ref={eventsRef}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${eventsVisible ? 'animate-fade-left delay-0' : 'opacity-0'}`}>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Upcoming Events</h2>
                        <p className="text-gray-500 text-sm mt-0.5">{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>
                    </div>
                </div>

                {/* Category filter pills */}
                {categories.length > 1 && (
                    <div className={`flex gap-2 flex-wrap mb-7 ${eventsVisible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border hover:-translate-y-0.5 ${
                                    activeCategory === cat
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-105'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md'
                                }`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 font-medium">Loading events…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-pop-in">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl animate-float">🔍</div>
                        <p className="text-gray-500 font-semibold">No events found</p>
                        <p className="text-gray-400 text-sm">Try a different search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                        {filtered.map((event, idx) => {
                            const seatsLeft = event.availableSeats;
                            const seatsPercent = Math.round((seatsLeft / event.totalSeats) * 100);
                            const isSoldOut = seatsLeft <= 0;
                            const isLow = seatsPercent <= 20 && !isSoldOut;
                            const delays = ['delay-0','delay-100','delay-200','delay-300','delay-400','delay-500'];
                            const d = delays[idx % delays.length];

                            return (
                                <div key={event._id}
                                    className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col
                                        hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-300
                                        ${eventsVisible ? `animate-slide-card ${d}` : 'opacity-0'}`}
                                    style={{ '--tw-shadow-color': 'rgba(99,102,241,0.1)' }}>

                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden bg-gray-100">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-gray-900 flex items-center justify-center">
                                                <span className="text-white/20 text-4xl font-black uppercase tracking-widest">{event.category}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />

                                        {/* Price badge */}
                                        <div className="absolute top-3 right-3 group-hover:scale-110 transition-transform duration-200">
                                            <span className={`text-xs font-black px-3 py-1.5 rounded-full shadow-lg ${event.ticketPrice === 0 ? 'bg-emerald-500 text-white' : 'bg-white/95 backdrop-blur-sm text-gray-900'}`}>
                                                {event.ticketPrice === 0 ? '🎉 FREE' : `₹${event.ticketPrice}`}
                                            </span>
                                        </div>

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

                                        {/* Hover overlay shimmer */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform transition-transform duration-700" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-grow">
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{event.category}</span>
                                        <h2 className="text-base font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors duration-200">{event.title}</h2>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <FaCalendarAlt className="text-indigo-300 shrink-0 group-hover:text-indigo-500 transition-colors" />
                                                <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <button onClick={e => openMap(event.location, e)}
                                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-rose-500 transition-colors group/loc w-full text-left">
                                                <FaMapMarkerAlt className="text-gray-400 group-hover/loc:text-rose-500 shrink-0 transition-colors group-hover/loc:animate-bounce" />
                                                <span className="truncate group-hover/loc:underline underline-offset-2">{event.location}</span>
                                            </button>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1.5">
                                                <span>{isSoldOut ? 'No seats left' : `${seatsLeft} seats left`}</span>
                                                <span>{event.totalSeats} total</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                                                <div className={`h-1.5 rounded-full transition-all duration-700 ${isSoldOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                    style={{ width: `${seatsPercent}%` }} />
                                            </div>

                                            <Link to={`/events/${event._id}`}
                                                className="group/btn flex items-center justify-center gap-2 w-full bg-gray-950 hover:bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5">
                                                View Details
                                                <FaArrowRight className="text-xs group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-100 text-center animate-fade-up">
                <div className="flex justify-center items-center gap-2.5 mb-3 group cursor-default">
                    <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300 group-hover:rotate-12 transition-transform">
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
