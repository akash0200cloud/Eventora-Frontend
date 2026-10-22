import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import Contact from './pages/Contact';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

const Layout = () => {
    const location = useLocation();
    const { dark } = useTheme();
    const isAuth = AUTH_ROUTES.includes(location.pathname);

    if (isAuth) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col theme-transition ${dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/payment-failed" element={<PaymentFailed />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<h1 className="text-3xl font-bold text-center mt-20">404 - Page Not Found</h1>} />
                </Routes>
            </main>
        </div>
    );
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Layout />
            </Router>
        </ThemeProvider>
    );
}

export default App;
