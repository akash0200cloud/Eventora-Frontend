import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const ForgotPassword = () => {
    const [step, setStep] = useState('email'); // email -> otp -> done
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('otp');
            setSuccess('OTP sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally { setLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h2>
                <p className="text-gray-500">Reset your Eventora account password</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-center border border-red-100">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-center border border-green-100">{success}</div>}

            {step === 'email' && (
                <form onSubmit={handleSendOTP} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition">
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {step === 'otp' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">OTP</label>
                        <input type="text" required maxLength="6" placeholder="6-digit code" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition font-bold tracking-widest text-center text-lg" value={otp} onChange={e => setOtp(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input type="password" required className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-700 transition" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition">
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}

            {step === 'done' && (
                <div className="text-center space-y-4">
                    <div className="text-5xl">✅</div>
                    <p className="text-gray-700 font-semibold">Password reset successfully!</p>
                    <button onClick={() => navigate('/login')} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition">
                        Go to Login
                    </button>
                </div>
            )}

            <p className="text-center mt-6 text-gray-600">
                <Link to="/login" className="text-gray-900 font-bold hover:underline">Back to Login</Link>
            </p>
        </div>
    );
};

export default ForgotPassword;
