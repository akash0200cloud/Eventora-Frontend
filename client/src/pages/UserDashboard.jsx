
import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTicketAlt,
  FaTimesCircle,
  FaQrcode,
  FaCheckCircle,
  FaCalendarAlt,
  FaRupeeSign,
  FaClock,
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaMapMarkerAlt,
  FaArrowRight,
  FaSun,
  FaMoon,
  FaHourglassHalf,
  FaWallet,
} from "react-icons/fa";
import "./UserDashboard.css";

const STATUS_CONFIG = {
  confirmed: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    label: "Confirmed",
  },
  pending: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    label: "Pending",
  },
  cancelled: {
    dot: "bg-red-400",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    label: "Cancelled",
  },
  awaiting_payment: {
    dot: "bg-orange-400",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    label: "Awaiting Payment",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not available"
    : date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

/* Load Razorpay only when the user actually chooses to pay. */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function PaymentModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    if (loading || !booking?._id) return;

    setLoading(true);
    setError("");

    try {
      const razorpayReady = await loadRazorpay();
      if (!razorpayReady) {
        throw new Error("Razorpay could not load. Check your internet connection and try again.");
      }

      const { data } = await api.post("/payment/create-order", {
        bookingId: booking._id,
      });

      if (!data?.keyId || !data?.orderId || !data?.amount) {
        throw new Error("Payment order details are incomplete. Please contact support.");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Eventora",
        description: booking.eventId?.title || "Event booking",
        order_id: data.orderId,
        prefill: { email: booking.userId?.email || "" },
        theme: { color: "#6857ef" },
        handler: async (response) => {
          try {
            await api.post("/payment/verify", {
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setPaid(true);
            await onSuccess?.();
            window.setTimeout(() => onClose?.(), 1800);
          } catch (verifyError) {
            setError(
              verifyError?.response?.data?.message ||
                "Payment verification failed. Please contact support before retrying."
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (event) => {
        setError(
          event?.error?.description || "Payment failed. Please try again."
        );
        setLoading(false);
      });
      checkout.open();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="float-right rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Close payment dialog"
        >
          <FaTimes />
        </button>

        <div className="clear-both text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/15 text-3xl text-indigo-300">
            {paid ? <FaCheckCircle className="text-emerald-400" /> : <FaQrcode />}
          </div>

          <h2 id="payment-title" className="text-2xl font-black text-white">
            {paid ? "Payment Successful!" : "Complete Payment"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {booking?.eventId?.title || "Your event booking"}
          </p>
          <p className="mt-4 text-4xl font-black text-white">
            {formatCurrency(booking?.amount)}
          </p>
        </div>

        {paid ? (
          <p className="mt-5 text-center text-sm text-emerald-300">
            Payment verified. Refreshing your booking details…
          </p>
        ) : (
          <>
            {error && (
              <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing…
                </>
              ) : (
                <>Pay {formatCurrency(booking?.amount)} via Razorpay</>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Secure payment checkout by Razorpay
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({ user, onLogout, activeTab, setActiveTab, open, setOpen }) {
  const navItems = [
    { id: "bookings", icon: <FaTicketAlt />, label: "My Bookings" },
    { id: "profile", icon: <FaUser />, label: "My Profile" },
  ];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden border-r border-white/5 bg-gray-950 shadow-2xl transition-all duration-300 ${
          open ? "w-64" : "w-0 lg:w-20"
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/5 px-5 py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
            <FaTicketAlt />
          </div>
          <span
            className={`overflow-hidden whitespace-nowrap text-lg font-black tracking-tight text-white transition-all ${
              open ? "w-auto opacity-100" : "w-0 opacity-0 lg:hidden"
            }`}
          >
            Eventora
          </span>
        </div>

        <div className={`flex shrink-0 items-center gap-3 border-b border-white/5 px-5 py-5 ${!open ? "lg:justify-center" : ""}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-black uppercase text-white">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className={`overflow-hidden transition-all ${open ? "opacity-100" : "w-0 opacity-0 lg:hidden"}`}>
            <p className="truncate whitespace-nowrap text-sm font-bold text-white">
              {user?.name || "Eventora User"}
            </p>
            <p className="max-w-[150px] truncate whitespace-nowrap text-xs text-gray-500">
              {user?.email || ""}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white ${!open ? "lg:justify-center" : ""}`}
          >
            <FaHome className="shrink-0" />
            <span className={`whitespace-nowrap text-sm font-semibold ${open ? "" : "lg:hidden"}`}>
              Browse Events
            </span>
          </Link>

          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                activeTab === item.id
                  ? "border border-indigo-500/20 bg-indigo-600/20 text-indigo-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              } ${!open ? "lg:justify-center" : ""}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap text-sm font-semibold ${open ? "" : "lg:hidden"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/5 px-3 py-4">
          <button
            type="button"
            onClick={onLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-gray-400 transition hover:bg-red-500/10 hover:text-red-300 ${!open ? "lg:justify-center" : ""}`}
          >
            <FaSignOutAlt className="shrink-0" />
            <span className={`whitespace-nowrap text-sm font-semibold ${open ? "" : "lg:hidden"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoadError("");
    try {
      const response = await api.get("/bookings/my");
      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.bookings)
          ? payload.bookings
          : Array.isArray(payload?.data)
            ? payload.data
            : null;

      if (!list) {
        throw new Error("Unexpected bookings response. Check GET /bookings/my response format.");
      }
      setBookings(list);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not load bookings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchBookings();
  }, [user, navigate, fetchBookings]);

  const cancelBooking = async (booking) => {
    if (!booking?._id || booking.status === "cancelled") return;

    const hoursSinceBooking =
      (Date.now() - new Date(booking.bookedAt || Date.now()).getTime()) /
      (1000 * 60 * 60);
    const isRefundable =
      booking.paymentStatus === "paid" && hoursSinceBooking <= 24;

    const message =
      booking.paymentStatus === "paid"
        ? isRefundable
          ? `Cancel this booking and request a refund of ${formatCurrency(booking.amount)}?`
          : "Cancel this booking? It may not qualify for a refund under the current policy."
        : "Cancel this booking?";

    if (!window.confirm(message)) return;

    try {
      const { data } = await api.delete(`/bookings/${booking._id}`);
      window.alert(data?.message || "Booking cancellation request completed.");
      await fetchBookings();
    } catch (err) {
      window.alert(
        err?.response?.data?.message || "Error cancelling booking. Please try again."
      );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const awaitingPayment = bookings.filter(
    (b) => b.status === "awaiting_payment" ||
      (b.status === "confirmed" && b.paymentStatus === "not_paid" && Number(b.amount) > 0)
  ).length;
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const stats = [
    { label: "Total Bookings", value: bookings.length, icon: <FaTicketAlt />, tone: "blue" },
    { label: "Confirmed", value: confirmed, icon: <FaCheckCircle />, tone: "green" },
    { label: "Pending", value: pending, icon: <FaHourglassHalf />, tone: "amber" },
    { label: "Awaiting Payment", value: awaitingPayment, icon: <FaQrcode />, tone: "orange" },
    { label: "Total Spent", value: formatCurrency(totalSpent), icon: <FaWallet />, tone: "purple" },
  ];

  return (
    <div className="user-dashboard-theme min-h-screen">
      <div
        className={`ev-intro-overlay ${showIntro && user ? "" : "ev-intro-hidden"}`}
        aria-hidden={!showIntro}
      >
        <div className="ev-intro-glow" />
        <div className="ev-intro-content">
          <div className="ev-intro-logo"><FaTicketAlt /></div>
          <h2>Welcome to Eventora</h2>
          <p>Your next unforgettable experience starts here.</p>
          <div className="ev-intro-loader"><span /></div>
        </div>
      </div>

      <Sidebar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="flex min-h-screen flex-col transition-all duration-300 lg:ml-20">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-gray-950/95 px-4 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div>
              <h1 className="text-lg font-black leading-tight text-white">
                {activeTab === "bookings" ? "My Bookings" : "My Profile"}
              </h1>
              <p className="text-xs text-gray-500">
                Welcome back, {user?.name || "Event Explorer"}!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {awaitingPayment > 0 && (
              <span className="hidden rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300 sm:inline-flex">
                {awaitingPayment} payment{awaitingPayment === 1 ? "" : "s"} due
              </span>
            )}
            <button
              type="button"
              onClick={toggle}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10"
            >
              {dark ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-indigo-300" />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-black uppercase text-white">
              {user?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">
          {paymentBooking && (
            <PaymentModal
              booking={paymentBooking}
              onClose={() => setPaymentBooking(null)}
              onSuccess={fetchBookings}
            />
          )}

          <section className="ev-welcome-banner">
            <p className="ev-mini-label">YOUR EVENTORA SPACE</p>
            <h2>Hey, {user?.name?.trim()?.split(/\s+/)[0] || "Explorer"}! 👋</h2>
            <p>
              Your next great memory is waiting. Track your bookings, finish pending
              payments, and get ready for unforgettable events.
            </p>
            <Link to="/" className="ev-explore-link">
              Explore Events <FaArrowRight />
            </Link>
          </section>

          <section
            className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
            aria-label="Booking statistics"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                style={{ animationDelay: `${index * 140}ms` }}
                className={`ev-stat-card ev-stat-${stat.tone} group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg text-indigo-200">
                    {stat.icon}
                  </span>
                </div>
                <p className="break-words text-2xl font-black text-white sm:text-3xl">
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          {activeTab === "profile" && (
            <section className="ev-panel ev-reveal max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl font-black uppercase text-white shadow-lg">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-2xl font-black text-white">
                    {user?.name || "Eventora User"}
                  </h2>
                  <p className="break-words text-sm text-gray-400">{user?.email || "No email available"}</p>
                  {user?.role && (
                    <span className="mt-2 inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-bold uppercase text-indigo-300">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm leading-7 text-gray-400">
                Manage your event activity from this dashboard. Your bookings and
                payment status are loaded from your Eventora account.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("bookings")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-500"
              >
                View My Bookings <FaArrowRight />
              </button>
            </section>
          )}

          {activeTab === "bookings" && (
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="ev-mini-label">YOUR EVENT ACTIVITY</p>
                  <h2 className="text-2xl font-black text-white">Your Bookings</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    All your event reservations in one place.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchBookings}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {loadError && (
                <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  <p className="font-bold">Bookings could not be loaded</p>
                  <p className="mt-1">{loadError}</p>
                  <button
                    type="button"
                    onClick={fetchBookings}
                    className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 font-bold hover:bg-red-500/25"
                  >
                    Try again
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                  <p className="text-sm font-medium text-gray-400">Loading your bookings…</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="ev-panel ev-reveal rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-3xl text-indigo-300">
                    <FaTicketAlt />
                  </div>
                  <h3 className="text-xl font-black text-white">No bookings yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
                    Your next great experience is waiting. Explore upcoming events and
                    book your first ticket.
                  </p>
                  <Link to="/" className="ev-explore-link">
                    Browse Events <FaArrowRight />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {bookings.map((booking, index) => {
                    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                    const amount = Number(booking.amount) || 0;
                    const isPaid = booking.paymentStatus === "paid";
                    const canPay =
                      amount > 0 &&
                      (booking.status === "awaiting_payment" ||
                        (booking.status === "confirmed" && booking.paymentStatus === "not_paid"));
                    const isCancelled = booking.status === "cancelled";
                    const hoursSinceBooking =
                      (Date.now() -
                        new Date(booking.bookedAt || Date.now()).getTime()) /
                      (1000 * 60 * 60);
                    const isRefundable = isPaid && hoursSinceBooking <= 24;

                    return (
                      <article
                        key={booking._id || `${booking.eventId?._id || "booking"}-${index}`}
                        style={{ animationDelay: `${index * 130}ms` }}
                        className="ev-booking-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className={`h-1 w-full ${status.dot}`} />

                        <div className="flex-grow p-5">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <h3 className="line-clamp-2 text-base font-bold leading-snug text-white transition group-hover:text-indigo-200">
                              {booking.eventId?.title || "Event details unavailable"}
                            </h3>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${status.badge}`}>
                                {status.label}
                              </span>
                              {!isCancelled && booking.paymentStatus && (
                                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-gray-300">
                                  {String(booking.paymentStatus).replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mb-5 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <FaCalendarAlt className="shrink-0 text-indigo-300" />
                              <span>{formatDate(booking.eventId?.date)}</span>
                            </div>

                            {booking.eventId?.location && (
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <FaMapMarkerAlt className="shrink-0 text-rose-300" />
                                <span className="truncate">{booking.eventId.location}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-300">
                              <FaRupeeSign className="shrink-0 text-indigo-300" />
                              <span className="font-bold">
                                {amount === 0 ? "Free Event" : formatCurrency(amount)}
                              </span>
                              {Number(booking.persons) > 1 && (
                                <span className="text-gray-500">
                                  · {booking.persons} persons
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FaClock className="shrink-0" />
                              <span>Booked on {formatDate(booking.bookedAt)}</span>
                            </div>
                          </div>

                          {canPay && (
                            <button
                              type="button"
                              onClick={() => setPaymentBooking(booking)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110"
                            >
                              <FaQrcode /> Pay Now {formatCurrency(amount)}
                            </button>
                          )}

                          {isPaid && !isCancelled && (
                            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-300">
                              <FaCheckCircle /> Payment Completed
                            </div>
                          )}

                          {booking.refundStatus === "pending" && (
                            <div className="mt-2 rounded-xl border border-pink-500/20 bg-pink-500/10 py-2 text-center text-xs font-bold text-pink-300">
                              Refund Pending
                            </div>
                          )}

                          {booking.refundStatus === "processed" && (
                            <div className="mt-2 rounded-xl border border-teal-500/20 bg-teal-500/10 py-2 text-center text-xs font-bold text-teal-300">
                              Refund Processed
                            </div>
                          )}

                          {booking.cancellationNote && isCancelled && (
                            <p className="mt-3 text-center text-xs italic text-gray-400">
                              {booking.cancellationNote}
                            </p>
                          )}
                        </div>

                        <footer className="flex items-center justify-between gap-3 border-t border-white/5 bg-white/[0.02] px-5 py-4">
                          {booking.eventId?._id && !isCancelled ? (
                            <Link
                              to={`/events/${booking.eventId._id}`}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-indigo-200"
                            >
                              View Event <FaArrowRight className="text-xs" />
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {isCancelled ? "Booking cancelled" : "Event unavailable"}
                            </span>
                          )}

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => cancelBooking(booking)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-400 transition hover:text-red-300"
                            >
                              <FaTimesCircle />
                              {isRefundable ? "Cancel / Refund" : "Cancel"}
                            </button>
                          )}
                        </footer>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

