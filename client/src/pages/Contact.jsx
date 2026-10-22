import React, { useState } from 'react';
import api from '../utils/axios';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError('');
        setSubmitted(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSubmitted(false);

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();
        const subject = formData.subject.trim();
        const message = formData.message.trim();

        if (!name || !email || !subject || !message) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/enquiries', {
                name,
                email,
                subject,
                message,
            });

            console.log('Enquiry submitted:', response.data);

            setSubmitted(true);

            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
            });
        } catch (err) {
            console.error('Enquiry submission error:', err);

            const messageFromServer =
                err.response?.data?.message ||
                err.message ||
                'Unable to send your message. Please try again.';

            setError(messageFromServer);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Heading */}
                <div className="text-center mb-12 animate-fade-in">
                    <p className="text-blue-600 font-semibold uppercase tracking-wider">
                        Get In Touch
                    </p>

                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mt-2">
                        Contact Us
                    </h1>

                    <p className="text-gray-500 mt-4 max-w-2xl mx-auto">
                        Have a question, suggestion or need help with Eventora?
                        Send us a message and our support team will get back to you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* Contact Information */}
                    <div className="
                        bg-gradient-to-br from-blue-900 to-indigo-700
                        text-white rounded-3xl p-8 md:p-10
                        shadow-xl
                        transform transition duration-300
                        hover:-translate-y-1 hover:shadow-2xl
                    ">
                        <div className="mb-8">
                            <span className="
                                inline-flex items-center justify-center
                                w-14 h-14 rounded-2xl
                                bg-white/20 text-2xl mb-5
                            ">
                                💬
                            </span>

                            <h2 className="text-3xl font-bold">
                                Let's Talk To Event Management
                            </h2>

                            <p className="text-blue-100 leading-7 mt-4">
                                We would love to hear from you. Feel free to
                                contact us for questions, suggestions,
                                event support or any other assistance.
                            </p>
                        </div>

                        <div className="space-y-5">

                            {/* Email */}
                            <div className="
                                bg-white/10 backdrop-blur-sm
                                rounded-2xl p-5
                                transition duration-300
                                hover:bg-white/20
                            ">
                                <p className="text-blue-200 text-sm mb-1">
                                    Email
                                </p>

                                <p className="font-semibold break-all">
                                    akashkrsoni0200@gmail.com
                                </p>
                            </div>

                            {/* Phone */}
                            <div className="
                                bg-white/10 backdrop-blur-sm
                                rounded-2xl p-5
                                transition duration-300
                                hover:bg-white/20
                            ">
                                <p className="text-blue-200 text-sm mb-1">
                                    Phone
                                </p>

                                <p className="font-semibold">
                                    +91 9431585217
                                </p>
                            </div>

                            {/* Address */}
                            <div className="
                                bg-white/10 backdrop-blur-sm
                                rounded-2xl p-5
                                transition duration-300
                                hover:bg-white/20
                            ">
                                <p className="text-blue-200 text-sm mb-1">
                                    Address
                                </p>

                                <p className="font-semibold">
                                    Panipat Haryana 132145
                                </p>
                            </div>
                        </div>

                        {/* Support Badge */}
                        <div className="
                            mt-8 pt-6 border-t border-white/20
                            flex items-center gap-3
                        ">
                            <div className="
                                w-3 h-3 bg-green-400
                                rounded-full animate-pulse
                            " />

                            <p className="text-blue-100 text-sm">
                                Eventora Support is available
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="
                        bg-white rounded-3xl p-8 md:p-10
                        shadow-xl border border-gray-100
                        transition duration-300
                        hover:shadow-2xl
                    ">
                        <div className="flex items-center gap-3 mb-7">
                            <div className="
                                w-11 h-11 rounded-xl
                                bg-blue-100 text-blue-500
                                flex items-center justify-center
                                text-xl
                            ">
                                ✉️
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Send Us a Message
                                </h2>

                                <p className="text-gray-500 text-sm mt-1">
                                    We usually respond as soon as possible.
                                </p>
                            </div>
                        </div>

                        {/* Success Message */}
                        {submitted && (
                            <div className="
                                mb-6 p-4 rounded-xl
                                bg-green-50 border border-green-200
                                text-green-700
                                flex items-start gap-3
                            ">
                                <span className="text-xl">✅</span>

                                <div>
                                    <p className="font-semibold">
                                        Message sent successfully!
                                    </p>

                                    <p className="text-sm mt-1">
                                        Our team will review your enquiry
                                        and reply to your email.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="
                                mb-6 p-4 rounded-xl
                                bg-red-50 border border-red-200
                                text-red-700
                                flex items-start gap-3
                            ">
                                <span className="text-xl">⚠️</span>

                                <div>
                                    <p className="font-semibold">
                                        Something went wrong
                                    </p>

                                    <p className="text-sm mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="contact-name"
                                    className="block text-gray-700 font-medium mb-2"
                                >
                                    Your Name
                                </label>

                                <input
                                    id="contact-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    autoComplete="name"
                                    required
                                    disabled={loading}
                                    className="
                                        w-full border border-gray-300
                                        rounded-xl px-4 py-3
                                        outline-none
                                        transition duration-200
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                        hover:border-blue-300
                                        disabled:bg-gray-100
                                    "
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="contact-email"
                                    className="block text-gray-700 font-medium mb-2"
                                >
                                    Email Address
                                </label>

                                <input
                                    id="contact-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    className="
                                        w-full border border-gray-300
                                        rounded-xl px-4 py-3
                                        outline-none
                                        transition duration-200
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                        hover:border-blue-300
                                        disabled:bg-gray-100
                                    "
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label
                                    htmlFor="contact-subject"
                                    className="block text-gray-700 font-medium mb-2"
                                >
                                    Subject
                                </label>

                                <input
                                    id="contact-subject"
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="What is your enquiry about?"
                                    required
                                    disabled={loading}
                                    className="
                                        w-full border border-gray-300
                                        rounded-xl px-4 py-3
                                        outline-none
                                        transition duration-200
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                        hover:border-blue-300
                                        disabled:bg-gray-100
                                    "
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label
                                    htmlFor="contact-message"
                                    className="block text-gray-700 font-medium mb-2"
                                >
                                    Message
                                </label>

                                <textarea
                                    id="contact-message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Write your message..."
                                    rows={5}
                                    required
                                    disabled={loading}
                                    className="
                                        w-full border border-gray-300
                                        rounded-xl px-4 py-3
                                        outline-none
                                        transition duration-200
                                        focus:ring-2
                                        focus:ring-blue-500
                                        focus:border-blue-500
                                        hover:border-blue-300
                                        resize-none
                                        disabled:bg-gray-100
                                    "
                                />
                            </div>

                        
                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="
                                    w-full
                                    bg-gradient-to-r
                                    from-blue-600 to-indigo-600
                                    text-white
                                    py-3.5
                                    rounded-xl
                                    font-semibold
                                    shadow-lg
                                    transition-all duration-300
                                    hover:from-blue-700
                                    hover:to-indigo-700
                                    hover:-translate-y-0.5
                                    hover:shadow-xl
                                    active:scale-95
                                    disabled:opacity-60
                                    disabled:cursor-not-allowed
                                    disabled:transform-none
                                "
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span
                                            className="
                                                w-5 h-5
                                                border-2 border-white/40
                                                border-t-white
                                                rounded-full
                                                animate-spin
                                            "
                                        />
                                        Sending...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Send Message
                                        <span className="text-lg">✉️</span>
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;

