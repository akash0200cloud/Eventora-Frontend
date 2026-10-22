// import React, { useContext, useState, useEffect } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { AuthContext } from '../context/AuthContext';
// import { FaTicketAlt, FaBars, FaTimes } from 'react-icons/fa';

// const Navbar = () => {
//     const { user, logout } = useContext(AuthContext);
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [scrolled, setScrolled] = useState(false);
//     const [menuOpen, setMenuOpen] = useState(false);

//     useEffect(() => {
//         const onScroll = () => setScrolled(window.scrollY > 20);
//         window.addEventListener('scroll', onScroll);
//         return () => window.removeEventListener('scroll', onScroll);
//     }, []);

//     useEffect(() => setMenuOpen(false), [location]);

//     const handleLogout = () => { logout(); navigate('/login'); };

//     return (
//         <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-950/95 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-gray-950'}`}>
//             <div className="max-w-7xl mx-auto px-4 sm:px-6">
//                 <div className="flex justify-between items-center h-16">
//                     {/* Logo */}
//                     <Link to="/" className="flex items-center gap-2.5 group">
//                         <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
//                             <FaTicketAlt className="text-gray-900 text-sm" />
//                         </div>
//                         <span className="text-white text-xl font-black tracking-tight">Eventora</span>
//                     </Link>

//                     {/* Desktop Nav */}
//                     <div className="hidden md:flex items-center gap-1">
//                         <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
//                             Events
//                         </Link>
//                         {user ? (
//                             <>
//                                 <Link
//                                     to={user.role === 'admin' ? '/admin' : '/dashboard'}
//                                     className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location.pathname.includes('dashboard') || location.pathname.includes('admin') ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
//                                 >
//                                     Dashboard
//                                 </Link>
//                                 <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/10">
//                                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-black uppercase border border-white/20">
//                                         {user.name?.charAt(0)}
//                                     </div>
//                                     <button
//                                         onClick={handleLogout}
//                                         className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 text-sm font-semibold px-4 py-2 rounded-lg transition-all border border-white/10 hover:border-red-500/30"
//                                     >
//                                         Logout
//                                     </button>
//                                 </div>
//                             </>
//                         ) : (
//                             <div className="flex items-center gap-2 ml-2">
//                                 <Link to="/login" className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
//                                     Login
//                                 </Link>
//                                 <Link to="/register" className="bg-white text-gray-900 hover:bg-gray-100 text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5">
//                                     Sign Up
//                                 </Link>
//                             </div>
//                         )}
//                     </div>

//                     {/* Mobile hamburger */}
//                     <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition">
//                         {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
//                     </button>
//                 </div>

//                 {/* Mobile Menu */}
//                 {menuOpen && (
//                     <div className="md:hidden border-t border-white/10 py-3 space-y-1 pb-4">
//                         <Link to="/" className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Events</Link>
//                         {user ? (
//                             <>
//                                 <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Dashboard</Link>
//                                 <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold text-sm transition">Logout</button>
//                             </>
//                         ) : (
//                             <>
//                                 <Link to="/login" className="block px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg font-semibold text-sm transition">Login</Link>
//                                 <Link to="/register" className="block mx-4 mt-2 bg-white text-gray-900 font-bold py-2.5 px-4 rounded-lg text-sm text-center">Sign Up</Link>
//                             </>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </nav>
//     );
// };

// export default Navbar;


import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaTicketAlt, FaBars, FaTimes, FaSun, FaMoon } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // =========================
    // SCROLL EFFECT
    // =========================
    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', onScroll);

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    // Close mobile menu whenever route changes
    useEffect(() => {
        setMenuOpen(false);
    }, [location]);

    // =========================
    // LOGOUT
    // =========================
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // =========================
    // NAV LINK STYLE
    // =========================
    const navLink = (active = false) =>
        `relative px-4 py-2 rounded-xl text-sm font-semibold
        transition-all duration-300 ease-out
        transform-gpu
        ${
            active
                ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
        }
        hover:-translate-y-1
        hover:scale-[1.03]
        hover:shadow-lg
        active:translate-y-0
        active:scale-95`;

    return (
        <nav
            className={`
                sticky top-0 z-50
                transition-all duration-500
                ${
                    scrolled
                        ? 'bg-gray-950/95 backdrop-blur-xl shadow-2xl shadow-black/30'
                        : 'bg-gray-950'
                }
            `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">

                    {/* =========================
                        LOGO
                    ========================= */}
                    <Link
                        to="/"
                        className="
                            flex items-center gap-2.5 group
                            transition-all duration-300
                            hover:-translate-y-1
                        "
                    >
                        <div
                            className="
                                w-9 h-9
                                bg-white
                                rounded-xl
                                flex items-center justify-center
                                shadow-lg shadow-white/10
                                transition-all duration-300
                                group-hover:scale-110
                                group-hover:rotate-3
                                group-hover:shadow-xl
                                group-active:scale-95
                            "
                        >
                            <FaTicketAlt className="text-gray-900 text-sm" />
                        </div>

                        <span
                            className="
                                text-white text-xl font-black tracking-tight
                                transition-all duration-300
                                group-hover:text-gray-200
                            "
                        >
                            Eventora
                        </span>
                    </Link>

                    {/* =========================
                        DESKTOP NAV
                    ========================= */}
                    <div className="hidden md:flex items-center gap-1">

                        {/* EVENTS */}
                        <Link
                            to="/"
                            className={navLink(location.pathname === '/')}
                        >
                            Events
                        </Link>

                        {/* CONTACT US */}
                        <Link
                            to="/contact"
                            className={navLink(
                                location.pathname === '/contact'
                            )}
                        >
                            Contact Us
                        </Link>

                        {user ? (
                            <>
                                {/* DASHBOARD */}
                                <Link
                                    to={
                                        user.role === 'admin'
                                            ? '/admin'
                                            : '/dashboard'
                                    }
                                    className={navLink(
                                        location.pathname.includes(
                                            'dashboard'
                                        ) ||
                                            location.pathname.includes(
                                                'admin'
                                            )
                                    )}
                                >
                                    Dashboard
                                </Link>

                                {/* USER + LOGOUT */}
                                <div
                                    className="
                                        flex items-center gap-3
                                        ml-3 pl-3
                                        border-l border-white/10
                                    "
                                >
                                    {/* USER AVATAR */}
                                    <div
                                        className="
                                            w-9 h-9
                                            rounded-full
                                            bg-gradient-to-br
                                            from-gray-600 to-gray-900
                                            flex items-center justify-center
                                            text-white text-xs font-black uppercase
                                            border border-white/20
                                            shadow-lg
                                            transition-all duration-300
                                            hover:scale-110
                                            hover:-translate-y-1
                                            hover:rotate-3
                                            hover:shadow-xl
                                        "
                                    >
                                        {user.name?.charAt(0) || 'U'}
                                    </div>

                                    {/* LOGOUT */}
                                    <button
                                        onClick={handleLogout}
                                        className="
                                            relative
                                            bg-white/10
                                            hover:bg-red-500/20
                                            text-gray-300
                                            hover:text-red-400
                                            text-sm font-semibold
                                            px-4 py-2
                                            rounded-xl
                                            transition-all duration-300
                                            border border-white/10
                                            hover:border-red-500/40
                                            transform-gpu
                                            hover:-translate-y-1
                                            hover:scale-105
                                            hover:shadow-xl
                                            hover:shadow-red-500/10
                                            active:translate-y-0
                                            active:scale-95
                                        "
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-2">

                                {/* LOGIN */}
                                <Link
                                    to="/login"
                                    className="
                                        text-gray-400
                                        hover:text-white
                                        text-sm font-semibold
                                        px-4 py-2
                                        rounded-xl
                                        transition-all duration-300
                                        hover:bg-white/10
                                        transform-gpu
                                        hover:-translate-y-1
                                        hover:scale-105
                                        hover:shadow-lg
                                        active:translate-y-0
                                        active:scale-95
                                    "
                                >
                                    Login
                                </Link>

                                {/* SIGN UP */}
                                <Link
                                    to="/register"
                                    className="bg-white text-gray-900 hover:bg-gray-100 text-sm font-bold px-5 py-2 rounded-xl transition-all duration-300 shadow-lg shadow-white/10 transform-gpu hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-white/20 active:translate-y-0 active:scale-95"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* THEME TOGGLE */}
                        <button onClick={toggle}
                            className="ml-2 w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-95"
                            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            {dark ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-indigo-400" />}
                        </button>
                    </div>

                    {/* =========================
                        MOBILE MENU BUTTON
                    ========================= */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="
                            md:hidden
                            text-gray-400
                            hover:text-white
                            p-2.5
                            rounded-xl
                            bg-white/5
                            border border-white/10
                            transition-all duration-300
                            transform-gpu
                            hover:scale-110
                            hover:-translate-y-1
                            hover:bg-white/10
                            hover:shadow-lg
                            active:scale-90
                        "
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            <FaTimes size={18} />
                        ) : (
                            <FaBars size={18} />
                        )}
                    </button>
                </div>

                {/* =========================
                    MOBILE MENU
                ========================= */}
                {menuOpen && (
                    <div
                        className="
                            md:hidden
                            border-t border-white/10
                            py-4
                            space-y-2
                            pb-5
                            animate-in
                            fade-in
                            slide-in-from-top-2
                            duration-300
                        "
                    >
                        {/* EVENTS */}
                        <Link
                            to="/"
                            className="
                                block px-4 py-3
                                text-gray-300
                                hover:text-white
                                hover:bg-white/10
                                rounded-xl
                                font-semibold text-sm
                                transition-all duration-300
                                transform-gpu
                                hover:-translate-y-1
                                hover:translate-x-1
                                hover:shadow-lg
                                active:scale-95
                            "
                        >
                            🎟️ Events
                        </Link>

                        {/* CONTACT US */}
                        <Link
                            to="/contact"
                            className="
                                block px-4 py-3
                                text-gray-300
                                hover:text-white
                                hover:bg-white/10
                                rounded-xl
                                font-semibold text-sm
                                transition-all duration-300
                                transform-gpu
                                hover:-translate-y-1
                                hover:translate-x-1
                                hover:shadow-lg
                                active:scale-95
                            "
                        >
                            📞 Contact Us
                        </Link>

                        {user ? (
                            <>
                                {/* DASHBOARD */}
                                <Link
                                    to={
                                        user.role === 'admin'
                                            ? '/admin'
                                            : '/dashboard'
                                    }
                                    className="
                                        block px-4 py-3
                                        text-gray-300
                                        hover:text-white
                                        hover:bg-white/10
                                        rounded-xl
                                        font-semibold text-sm
                                        transition-all duration-300
                                        transform-gpu
                                        hover:-translate-y-1
                                        hover:translate-x-1
                                        hover:shadow-lg
                                        active:scale-95
                                    "
                                >
                                    📊 Dashboard
                                </Link>

                                {/* LOGOUT */}
                                <button
                                    onClick={handleLogout}
                                    className="
                                        w-full
                                        text-left
                                        px-4 py-3
                                        text-red-400
                                        hover:text-red-300
                                        hover:bg-red-500/10
                                        rounded-xl
                                        font-semibold text-sm
                                        transition-all duration-300
                                        transform-gpu
                                        hover:-translate-y-1
                                        hover:translate-x-1
                                        hover:shadow-lg
                                        active:scale-95
                                    "
                                >
                                    🚪 Logout
                                </button>
                            </>
                        ) : (
                            <>
                                {/* LOGIN */}
                                <Link
                                    to="/login"
                                    className="
                                        block px-4 py-3
                                        text-gray-300
                                        hover:text-white
                                        hover:bg-white/10
                                        rounded-xl
                                        font-semibold text-sm
                                        transition-all duration-300
                                        transform-gpu
                                        hover:-translate-y-1
                                        hover:translate-x-1
                                        hover:shadow-lg
                                        active:scale-95
                                    "
                                >
                                    🔐 Login
                                </Link>

                                {/* SIGN UP */}
                                <Link
                                    to="/register"
                                    className="
                                        block
                                        mx-4 mt-3
                                        bg-white
                                        text-gray-900
                                        font-bold
                                        py-3 px-4
                                        rounded-xl
                                        text-sm text-center
                                        transition-all duration-300
                                        shadow-lg
                                        transform-gpu
                                        hover:-translate-y-1
                                        hover:scale-[1.02]
                                        hover:shadow-2xl
                                        active:scale-95
                                    "
                                >
                                    ✨ Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

