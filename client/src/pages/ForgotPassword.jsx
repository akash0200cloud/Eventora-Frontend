import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { FaTicketAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
    const [step, setStep]                   = useState('email');
    const [email, setEmail]                 = useState('');
    const [otp, setOtp]                     = useState('');
    const [newPassword, setNewPassword]     = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd, setShowPwd]             = useState(false);
    const [loading, setLoading]             = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError]                 = useState('');
    const [success, setSuccess]             = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('otp');
            setSuccess('OTP sent! Check your email inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP.');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        setResendLoading(true); setError(''); setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess('OTP resent! Check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally { setResendLoading(false); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true); setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Check your OTP.');
        } finally { setLoading(false); }
    };

    const steps = ['Email', 'Reset'];
    const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-up">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                            {step === 'done' ? <FaCheckCircle className="text-white text-xl" /> : <FaLock className="text-white text-xl" />}
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">
                            {step === 'done' ? 'Password Reset!' : 'Forgot Password'}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1 text-center">
                            {step === 'email' && 'Enter your email to receive a reset OTP'}
                            {step === 'otp' && `OTP sent to ${email}`}
                            {step === 'done' && 'Your password has been updated successfully'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    {step !== 'done' && (
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {steps.map((label, i) => (
                                <React.Fragment key={label}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                            i < stepIndex ? 'bg-emerald-500 text-white' :
                                            i === stepIndex ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                                            'bg-white/10 text-gray-500'
                                        }`}>
                                            {i < stepIndex ? <FaCheckCircle className="text-xs" /> : i + 1}
                                        </div>
                                        <span className={`text-xs font-semibold ${i === stepIndex ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`h-px w-8 transition-all ${i < stepIndex ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5 text-center">{error}</div>
                    )}
                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl mb-5 text-center">{success}</div>
                    )}

                    {step === 'email' && (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                    <input
                                        type="email" required placeholder="your@email.com"
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending OTP...
                                    </span>
                                ) : 'Send OTP to Email'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    <FaShieldAlt className="inline mr-1" /> Enter OTP
                                </label>
                                <input
                                    type="text" required maxLength="6" autoFocus
                                    placeholder="• • • • • •"
                                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-black tracking-[0.6em] text-center text-2xl"
                                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                                <button type="button" onClick={handleResend} disabled={resendLoading}
                                    className="mt-2 w-full text-center text-xs text-gray-500 hover:text-indigo-400 font-semibold transition">
                                    {resendLoading ? 'Resending...' : "Didn't receive? Resend OTP"}
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                    <input
                                        type={showPwd ? 'text' : 'password'} required placeholder="Min. 6 characters"
                                        className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                                        {showPwd ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                                    <input
                                        type="password" required placeholder="Re-enter password"
                                        className={`w-full bg-white/5 border text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-1 transition text-sm ${
                                            confirmPassword && confirmPassword !== newPassword
                                                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                                                : 'border-white/10 focus:border-indigo-500 focus:ring-indigo-500'
                                        }`}
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                                )}
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Resetting...
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>
                    )}

                    {step === 'done' && (
                        <div className="text-center space-y-5">
                            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-4xl">
                                ✅
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">Password Reset Successfully!</p>
                                <p className="text-gray-400 text-sm mt-1">You can now sign in with your new password.</p>
                            </div>
                            <button onClick={() => navigate('/login')}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5">
                                Go to Sign In
                            </button>
                        </div>
                    )}

                    {step !== 'done' && (
                        <p className="text-center text-gray-500 text-sm mt-6">
                            Remember your password?{' '}
                            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition">Sign in</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
