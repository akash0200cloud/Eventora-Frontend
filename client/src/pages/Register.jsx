import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaTicketAlt, FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle, FaRedo } from 'react-icons/fa';

const Register = () => {
    const [name,     setName]     = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [otp,      setOtp]      = useState('');
    const [showOTP,  setShowOTP]  = useState(false);
    const [showPwd,  setShowPwd]  = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');
    const [loading,  setLoading]  = useState(false);
    // "user exists but unverified" state
    const [userExists, setUserExists] = useState(false);

    const { register, verifyOTP, resendOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess(''); setUserExists(false);
        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
                setSuccess('Account created! Check your email for the OTP.');
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.message || 'Something went wrong';
            // Backend returns "User already exists." — check if unverified
            if (msg.toLowerCase().includes('already exists')) {
                setUserExists(true);
                setError('An account with this email already exists.');
            } else {
                setError(msg);
            }
        } finally { setLoading(false); }
    };

    const handleResendVerification = async () => {
        if (!email) { setError('Enter your email first.'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            await resendOTP(email);
            setUserExists(false);
            setShowOTP(true);
            setSuccess('Verification OTP resent! Check your inbox.');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally { setLoading(false); }
    };

    const handleResendOTP = async () => {
        if (!email) { setError('Email is required.'); return; }
        setLoading(true); setError(''); setSuccess('');
        try {
            await resendOTP(email);
            setSuccess('OTP resent! Check your inbox.');
        } catch (err) { setError(err.message || 'Failed to resend OTP'); }
        finally { setLoading(false); }
    };

    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
    const strengthColor = ['', 'bg-red-500', 'bg-yellow-400', 'bg-emerald-500'];

    const inp = 'w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm';

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-up">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                            <FaTicketAlt className="text-white text-xl" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {showOTP ? 'Verify Your Email' : 'Create Account'}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {showOTP ? `OTP sent to ${email}` : "Join Eventora today — it's free"}
                        </p>
                    </div>

                    {/* Step indicator */}
                    {!userExists && (
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {['Details', 'Verify'].map((label, i) => (
                                <React.Fragment key={label}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                            (i === 0 && !showOTP) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                                            (i === 0 && showOTP)  ? 'bg-emerald-500 text-white' :
                                            (i === 1 && showOTP)  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                                            'bg-white/10 text-gray-500'
                                        }`}>
                                            {i === 0 && showOTP ? <FaCheckCircle className="text-xs" /> : i + 1}
                                        </div>
                                        <span className={`text-xs font-semibold ${(i === 0 && !showOTP) || (i === 1 && showOTP) ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                                    </div>
                                    {i === 0 && <div className={`h-px w-8 transition-all ${showOTP ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl mb-4 text-center">
                            {success}
                        </div>
                    )}

                    {/* ── User Already Exists Panel ── */}
                    {userExists ? (
                        <div className="space-y-4">
                            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5 text-center">
                                <div className="text-3xl mb-2">📧</div>
                                <h3 className="text-white font-black text-lg mb-1">Account Already Exists</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    An account with <span className="text-white font-bold">{email}</span> already exists.
                                    If you haven't verified it yet, we can resend the verification email.
                                </p>
                            </div>

                            <button onClick={handleResendVerification} disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                    : <><FaRedo /> Resend Verification Email</>}
                            </button>

                            <div className="flex gap-3">
                                <button onClick={() => { setUserExists(false); setError(''); setSuccess(''); }}
                                    className="flex-1 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold py-3 rounded-xl transition text-sm">
                                    ← Try Different Email
                                </button>
                                <Link to="/login"
                                    className="flex-1 bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 font-bold py-3 rounded-xl transition text-sm text-center">
                                    Sign In Instead
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!showOTP ? (
                                <>
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                        <div className="relative">
                                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                            <input type="text" required placeholder="Your full name" className={inp} value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                        <div className="relative">
                                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                            <input type="email" required placeholder="you@example.com" className={inp} value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                                        <div className="relative">
                                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                            <input type={showPwd ? 'text' : 'password'} required minLength={6} placeholder="Min. 6 characters"
                                                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                                                value={password} onChange={e => setPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowPwd(!showPwd)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                                                {showPwd ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {password.length > 0 && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex gap-1 flex-1">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-white/10'}`} />
                                                    ))}
                                                </div>
                                                <span className={`text-xs font-bold ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                    {strengthLabel[strength]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* OTP Step */
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        <FaShieldAlt className="inline mr-1" /> Verification Code
                                    </label>
                                    <input type="text" required maxLength="6" autoFocus placeholder="• • • • • •"
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-black tracking-[0.6em] text-center text-2xl"
                                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                                    <button type="button" onClick={handleResendOTP} disabled={loading}
                                        className="mt-3 w-full text-center text-xs text-gray-500 hover:text-indigo-400 font-semibold transition disabled:opacity-50">
                                        Didn't receive it? Resend OTP
                                    </button>
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : showOTP ? 'Verify & Create Account' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {!userExists && (
                        <p className="text-center text-gray-500 text-sm mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition">Sign in</Link>
                        </p>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-5 flex items-center justify-center gap-1.5">
                    <FaShieldAlt /> Email OTP verification required
                </p>
            </div>
        </div>
    );
};

export default Register;
