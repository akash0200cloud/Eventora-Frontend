import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const ForgotPassword = () => {
    const [step, setStep] = useState('email'); // email -> otp -> done
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('otp');
            setSuccess('OTP sent! Check your email inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
        } finally { setLoading(false); }
    };

    const handleResendOTP = async () => {
        setResendLoading(true); setError(''); setSuccess('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess('OTP resent! Check your email inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally { setResendLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true); setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Check your OTP.');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔑</div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h2>
                <p className="text-gray-500 text-sm">
                    {step === 'email' && 'Enter your email to receive a reset OTP'}
                    {step === 'otp' && `OTP sent to ${email}`}
                    {step === 'done' && 'Password updated successfully'}
                </p>
            </div>

            {/* Step indicator */}
            {step !== 'done' && (
                <div className="flex items-center justify-center gap-2 mb-6">
                    {['email', 'otp'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                                step === s ? 'bg-gray-900 text-white' :
                                (step === 'otp' && s === 'email') ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                                {step === 'otp' && s === 'email' ? '✓' : i + 1}
                            </div>
                            {i === 0 && <div className={`h-0.5 w-12 ${step === 'otp' ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center border border-red-100 text-sm">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-center border border-green-100 text-sm">{success}</div>}

            {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email" required
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={email} onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition shadow-md">
                        {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                    </button>
                </form>
            )}

            {step === 'otp' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                        <input
                            type="text" required maxLength="6"
                            placeholder="6-digit code"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 outline-none transition font-bold tracking-widest text-center text-lg"
                            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        />
                        <button type="button" onClick={handleResendOTP} disabled={resendLoading}
                            className="mt-2 text-sm text-gray-600 font-semibold hover:text-black transition">
                            {resendLoading ? 'Resending...' : "Didn't receive? Resend OTP"}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                            type="password" required
                            placeholder="Min. 6 characters"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                        <input
                            type="password" required
                            placeholder="Re-enter new password"
                            className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-gray-700 outline-none transition ${
                                confirmPassword && confirmPassword !== newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition shadow-md">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}

            {step === 'done' && (
                <div className="text-center space-y-5">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">✅</div>
                    <div>
                        <p className="text-gray-900 font-bold text-lg">Password Reset Successfully!</p>
                        <p className="text-gray-500 text-sm mt-1">You can now log in with your new password.</p>
                    </div>
                    <button onClick={() => navigate('/login')} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition shadow-md">
                        Go to Login
                    </button>
                </div>
            )}

            {step !== 'done' && (
                <p className="text-center mt-6 text-gray-500 text-sm">
                    Remember your password? <Link to="/login" className="text-gray-900 font-bold hover:underline">Sign in</Link>
                </p>
            )}
        </div>
    );
};

export default ForgotPassword;
