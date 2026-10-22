// import React, { useState, useContext, useEffect } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// import { FaTicketAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

// const Login = () => {
//     const [email, setEmail]       = useState('');
//     const [password, setPassword] = useState('');
//     const [otp, setOtp]           = useState('');
//     const [showOTP, setShowOTP]   = useState(false);
//     const [showPwd, setShowPwd]   = useState(false);
//     const [error, setError]       = useState('');
//     const [success, setSuccess]   = useState('');
//     const [loading, setLoading]   = useState(false);

//     const { login, verifyOTP, resendOTP } = useContext(AuthContext);
//     const navigate = useNavigate();

//     useEffect(() => {
//         localStorage.removeItem('token');
//         localStorage.removeItem('userInfo');
//     }, []);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true); setError(''); setSuccess('');
//         try {
//             if (!showOTP) {
//                 const data = await login(email, password);
//                 navigate(data.role === 'admin' ? '/admin' : '/dashboard');
//             } else {
//                 const data = await verifyOTP(email, otp);
//                 navigate(data.role === 'admin' ? '/admin' : '/dashboard');
//             }
//         } catch (err) {
//             if (err.needsVerification) {
//                 setShowOTP(true);
//                 setSuccess('Account not verified. OTP sent to your email.');
//             } else {
//                 setError(err.message || 'Something went wrong.');
//             }
//         } finally { setLoading(false); }
//     };

//     const handleResend = async () => {
//         if (!email) { setError('Enter your email first.'); return; }
//         try {
//             await resendOTP(email);
//             setSuccess('OTP resent! Check your inbox.');
//             setError('');
//         } catch (err) { setError(err.message || 'Failed to resend OTP'); }
//     };

//     return (
//         <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
//             {/* Background blobs */}
//             <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
//             <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
//             <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

//             <div className="w-full max-w-md relative z-10 animate-fade-up">
//                 {/* Card */}
//                 <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

//                     {/* Logo */}
//                     <div className="flex flex-col items-center mb-8">
//                         <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
//                             <FaTicketAlt className="text-white text-xl" />
//                         </div>
//                         <h1 className="text-2xl font-black text-white tracking-tight">
//                             {showOTP ? 'Verify Your Identity' : 'Welcome Back'}
//                         </h1>
//                         <p className="text-gray-400 text-sm mt-1">
//                             {showOTP ? `OTP sent to ${email}` : 'Sign in to your Eventora account'}
//                         </p>
//                     </div>

//                     {/* Alerts */}
//                     {error && (
//                         <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-5 text-center">
//                             {error}
//                         </div>
//                     )}
//                     {success && (
//                         <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm p-3 rounded-xl mb-5 text-center">
//                             {success}
//                         </div>
//                     )}

//                     <form onSubmit={handleSubmit} className="space-y-4">
//                         {!showOTP ? (
//                             <>
//                                 {/* Email */}
//                                 <div>
//                                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
//                                     <div className="relative">
//                                         <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
//                                         <input
//                                             type="email" required
//                                             placeholder="you@example.com"
//                                             className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
//                                             value={email}
//                                             onChange={e => setEmail(e.target.value)}
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Password */}
//                                 <div>
//                                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
//                                     <div className="relative">
//                                         <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
//                                         <input
//                                             type={showPwd ? 'text' : 'password'} required
//                                             placeholder="••••••••"
//                                             className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-11 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
//                                             value={password}
//                                             onChange={e => setPassword(e.target.value)}
//                                         />
//                                         <button type="button" onClick={() => setShowPwd(!showPwd)}
//                                             className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
//                                             {showPwd ? <FaEyeSlash /> : <FaEye />}
//                                         </button>
//                                     </div>
//                                     <div className="text-right mt-2">
//                                         <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-indigo-400 transition font-semibold">
//                                             Forgot Password?
//                                         </Link>
//                                     </div>
//                                 </div>
//                             </>
//                         ) : (
//                             /* OTP Step */
//                             <div>
//                                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
//                                     <FaShieldAlt className="inline mr-1" /> Verification Code
//                                 </label>
//                                 <input
//                                     type="text" required maxLength="6" autoFocus
//                                     placeholder="• • • • • •"
//                                     className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 px-4 py-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-black tracking-[0.6em] text-center text-2xl"
//                                     value={otp}
//                                     onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
//                                 />
//                                 <button type="button" onClick={handleResend}
//                                     className="mt-3 w-full text-center text-xs text-gray-500 hover:text-indigo-400 font-semibold transition">
//                                     Didn't receive it? Resend OTP
//                                 </button>
//                             </div>
//                         )}

//                         <button type="submit" disabled={loading}
//                             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2">
//                             {loading ? (
//                                 <span className="flex items-center justify-center gap-2">
//                                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                                     Processing...
//                                 </span>
//                             ) : showOTP ? 'Verify & Sign In' : 'Sign In'}
//                         </button>
//                     </form>

//                     {/* Footer */}
//                     <p className="text-center text-gray-500 text-sm mt-6">
//                         Don't have an account?{' '}
//                         <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition">
//                             Create one
//                         </Link>
//                     </p>
//                 </div>

//                 {/* Bottom badge */}
//                 <p className="text-center text-gray-600 text-xs mt-5 flex items-center justify-center gap-1.5">
//                     <FaShieldAlt /> Protected by 2FA OTP verification
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Login;


import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  FaTicketAlt,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaArrowRight,
  FaCheckCircle,
} from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login, verifyOTP, resendOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || loginSuccess) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let data;

      if (!showOTP) {
        data = await login(email.trim(), password);
      } else {
        data = await verifyOTP(email.trim(), otp);
      }

      // Animation starts only after authentication succeeds.
      setLoginSuccess(true);
      setSuccess("Authentication successful! Welcome to Eventora.");

      const role =
        data?.role ||
        data?.user?.role ||
        data?.userInfo?.role;

      // Allow the 3D success animation to finish before navigation.
      window.setTimeout(() => {
        navigate(role === "admin" ? "/admin" : "/dashboard");
      }, 1100);
    } catch (err) {
      if (err?.needsVerification) {
        setShowOTP(true);
        setSuccess("OTP sent to your email. Please verify your account.");
      } else {
        setError(
          err?.message || "Login failed. Please check your details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendOTP(email.trim());
      setSuccess("OTP resent successfully. Check your inbox.");
    } catch (err) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`login-scene ${loginSuccess ? "login-complete" : ""}`}>
      <div className="login-grid" />
      <div className="light-orb orb-one" />
      <div className="light-orb orb-two" />
      <div className="light-orb orb-three" />

      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />

      <section className="login-layout">
        <div className="login-intro">
          <div className="brand-symbol">
            <FaTicketAlt />
          </div>

          <p className="eyebrow">YOUR NEXT EXPERIENCE STARTS HERE</p>

          <h1>
            Events that
            <br />
            <span>move you.</span>
          </h1>

          <p className="intro-description">
            Discover amazing experiences, book your tickets,
            and make every moment unforgettable.
          </p>

          <div className="trust-line">
            <span className="trust-icon">
              <FaShieldAlt />
            </span>
            Secure access to your Eventora account
          </div>

          <div className="floating-ticket">
            <FaTicketAlt />
            <span>YOUR NEXT BIG MOMENT</span>
            <strong>Starts with Eventora.</strong>
          </div>
        </div>

        <div className="login-card-wrap">
          <div className="card-light-ring" />

          <div className={`login-card ${loginSuccess ? "card-success" : ""}`}>
            <div className="card-top-line" />

            <div className="card-brand">
              <span className="mini-logo">
                <FaTicketAlt />
              </span>
              <span>EVENTORA</span>
              <span className="live-dot" />
            </div>

            <div className="login-heading">
              <p className="eyebrow">
                {showOTP ? "SECURE VERIFICATION" : "WELCOME BACK"}
              </p>

              <h2>
                {loginSuccess
                  ? "You're in!"
                  : showOTP
                  ? "Verify your identity"
                  : "Sign in"}
              </h2>

              <p>
                {loginSuccess
                  ? "Preparing your Eventora experience..."
                  : showOTP
                  ? `Enter the OTP sent to ${email}`
                  : "Your next unforgettable experience awaits."}
              </p>
            </div>

            {error && (
              <div className="login-alert alert-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="login-alert alert-success" role="status">
                {loginSuccess && <FaCheckCircle />}
                {success}
              </div>
            )}

            {loginSuccess ? (
              <div className="success-animation" aria-live="polite">
                <div className="success-circle">
                  <FaCheckCircle />
                </div>
                <div className="success-pulse" />
                <p>ACCESS GRANTED</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                {!showOTP ? (
                  <>
                    <label className="field-label" htmlFor="login-email">
                      Email address
                    </label>

                    <div className="input-shell">
                      <FaEnvelope className="input-icon" />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <label className="field-label" htmlFor="login-password">
                      Password
                    </label>

                    <div className="input-shell">
                      <FaLock className="input-icon" />
                      <input
                        id="login-password"
                        type={showPwd ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />

                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPwd((prev) => !prev)}
                        aria-label={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    <div className="forgot-row">
                      <Link to="/forgot-password">Forgot password?</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="field-label" htmlFor="login-otp">
                      <FaShieldAlt /> Verification code
                    </label>

                    <div className="input-shell otp-shell">
                      <input
                        id="login-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        required
                      />
                    </div>

                    <button
                      type="button"
                      className="resend-button"
                      onClick={handleResend}
                      disabled={loading}
                    >
                      Didn't receive the code? Resend OTP
                    </button>
                  </>
                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >
                  <span>
                    {loading
                      ? "Authenticating..."
                      : showOTP
                      ? "Verify & Sign In"
                      : "Enter Eventora"}
                  </span>

                  {!loading && <FaArrowRight />}
                  {loading && <span className="button-spinner" />}
                </button>
              </form>
            )}

            {!loginSuccess && (
              <>
                <div className="login-divider">
                  <span />
                  <small>YOUR EXPERIENCE, SECURED</small>
                  <span />
                </div>

                <p className="register-line">
                  New to Eventora?{" "}
                  <Link to="/register">Create account</Link>
                </p>
              </>
            )}

            <div className="security-note">
              <FaShieldAlt />
              Protected account access
            </div>
          </div>
        </div>
      </section>

      <footer className="login-footer">
        © {new Date().getFullYear()} Eventora · Every event, a memory.
      </footer>
    </main>
  );
};

export default Login;


