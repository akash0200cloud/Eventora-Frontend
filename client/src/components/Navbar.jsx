import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaTicketAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setMenuOpen(false), [location]);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-gray-950'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <FaTicketAlt className="text-gray-900 text-sm" />
                        </div>
                        <span className="text-white text-xl font-black tracking-tight">Eventora</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            Events
                        </Link>
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'admin' ? '/admin' : '/dashboard'}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location.pathname.includes('dashboard') || location.pathname.includes('admin') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    Dashboard
                                </Link>
                                <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/10">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-black uppercase border border-white/20">
                                        {user.name?.charAt(0)}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-red-500/30"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">
                                <Link to="/login" className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-white text-gray-900 hover:bg-gray-100 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition">
                        {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-white/10 py-3 space-y-1 pb-4">
                        <Link to="/" className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Events</Link>
                        {user ? (
                            <>
                                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Dashboard</Link>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold text-sm transition">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Login</Link>
                                <Link to="/register" className="block mx-4 mt-2 bg-white text-gray-900 font-bold py-2.5 px-4 rounded-lg text-sm text-center">Sign Up</Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
