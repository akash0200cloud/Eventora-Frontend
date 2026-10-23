

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


