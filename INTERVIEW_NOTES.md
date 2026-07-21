# 📋 EVENTORA — Complete Project Notes (Interview Ready)

---

## 🏗️ PROJECT OVERVIEW

**Eventora** ek Full-Stack MERN application hai jisme users events browse, register aur pay kar sakte hain bina kisi third-party payment gateway ke. Admin manually bookings confirm karta hai aur payments verify karta hai.

**Tech Stack:**
- **Frontend:** React 18, Vite, Tailwind CSS v3, React Router v6, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Auth:** JWT (JSON Web Token) + bcryptjs
- **Email:** Nodemailer (Gmail SMTP)
- **Dev Tool:** Nodemon

---

## 📁 PROJECT STRUCTURE

```
Eventora-Full-Stack/
├── client/                  → React Frontend (Vite)
│   └── src/
│       ├── components/
│       │   └── Navbar.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── EventDetail.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── UserDashboard.jsx
│       │   └── AdminDashboard.jsx
│       ├── utils/
│       │   └── axios.js
│       └── App.jsx
│
└── server/                  → Node/Express Backend
    ├── controllers/
    │   ├── authController.js
    │   ├── bookingController.js
    │   └── eventController.js
    ├── middleware/
    │   └── auth.js
    ├── models/
    │   ├── User.js
    │   ├── Event.js
    │   ├── Booking.js
    │   └── OTP.js
    ├── routes/
    │   ├── auth.js
    │   ├── events.js
    │   └── bookings.js
    ├── utils/
    │   └── email.js
    └── server.js
```

---

## 🔧 DEPENDENCIES — STEP BY STEP

### 📦 SERVER (Backend) — `server/package.json`

| Package | Version | Kaam kya hai |
|---|---|---|
| `express` | ^4.18.2 | Web framework — routes, middleware, HTTP server banata hai |
| `mongoose` | ^8.2.0 | MongoDB ka ODM — Schema define karo, queries karo JS mein |
| `bcryptjs` | ^2.4.3 | Password hashing — plain password ko hash mein convert karta hai |
| `jsonwebtoken` | ^9.0.2 | JWT token generate aur verify karta hai — authentication ke liye |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing — frontend (port 5173) ko backend (port 5000) se baat karne deta hai |
| `dotenv` | ^16.4.5 | `.env` file se environment variables load karta hai (MONGO_URI, JWT_SECRET etc.) |
| `nodemailer` | ^6.9.11 | Email bhejne ke liye — OTP aur booking confirmation emails |
| `nodemon` | ^3.1.0 | Dev dependency — file save hone par server auto-restart karta hai |

### 📦 CLIENT (Frontend) — `client/package.json`

| Package | Version | Kaam kya hai |
|---|---|---|
| `react` | ^18.2.0 | UI library — component-based frontend |
| `react-dom` | ^18.2.0 | React ko browser DOM se connect karta hai |
| `react-router-dom` | ^6.22.3 | Client-side routing — `/`, `/events/:id`, `/dashboard` etc. |
| `axios` | ^1.6.7 | HTTP requests — API calls backend ko |
| `react-icons` | ^5.0.1 | Icon library — FaCalendarAlt, FaMapMarkerAlt etc. |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework — inline classes se styling |
| `vite` | ^5.1.4 | Build tool — fast dev server, HMR (Hot Module Replacement) |
| `autoprefixer` | ^10.4.18 | CSS vendor prefixes auto-add karta hai |
| `postcss` | ^8.4.35 | CSS processing pipeline — Tailwind ke saath kaam karta hai |

---

## 🗄️ DATABASE MODELS — `server/models/`

### 1. `User.js`
```
Fields: name, email, password (hashed), role (user/admin), isVerified (boolean)
```
- `isVerified: false` by default — user register karne ke baad email OTP se verify karna padta hai
- `role: 'admin'` sirf database mein manually set hota hai — koi bhi register karke admin nahi ban sakta
- `timestamps: true` — createdAt, updatedAt auto-add hota hai

### 2. `Event.js`
```
Fields: title, description, date, location, category, totalSeats, availableSeats, image (URL), ticketPrice, createdBy (ref: User)
```
- `availableSeats` alag track hota hai `totalSeats` se — booking confirm hone par `availableSeats -= persons`
- `createdBy` — admin ka reference store hota hai (populate se naam/email milta hai)
- `ticketPrice: 0` means free event

### 3. `Booking.js`
```
Fields: userId (ref: User), eventId (ref: Event), status, paymentStatus, persons, amount, txnId, bookedAt
```
- `status` enum: `pending` → `awaiting_payment` → `confirmed` | `cancelled`
- `paymentStatus` enum: `paid` | `not_paid`
- `persons` — kitne logon ke liye booking hai (default: 1)
- `amount = ticketPrice × persons` — backend calculate karta hai
- `txnId` — user ka UPI transaction ID store hota hai

### 4. `OTP.js`
```
Fields: email, otp (6-digit string), action (enum), createdAt (TTL: 300 seconds)
```
- `action` enum: `account_verification` | `event_booking` | `payment_confirm`
- `expires: 300` — MongoDB TTL index — 5 minute mein OTP auto-delete ho jaata hai
- Har naya OTP generate hone se pehle purana delete hota hai (`findOneAndDelete`)

---

## 🔐 AUTHENTICATION SYSTEM — `server/controllers/authController.js`

### Register Flow:
1. User name, email, password bhejta hai
2. Email already exists? → Error
3. `bcrypt.hash(password, 10)` — password hash hota hai (salt rounds = 10)
4. User DB mein save hota hai `isVerified: false` ke saath
5. 6-digit OTP generate hota hai, OTP collection mein save hota hai
6. `nodemailer` se OTP email bheja jaata hai
7. Response: "OTP sent, please verify"

### Login Flow:
1. Email + password bhejta hai
2. `bcrypt.compare()` — password match check
3. Agar `isVerified: false` aur role `user` hai → OTP bhejo, 403 return karo
4. Admin ka `isVerified` check nahi hota — direct login
5. `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' })` — token generate
6. Token + user info response mein bhejo

### OTP Verify Flow:
1. Email + OTP bhejta hai
2. DB mein OTP dhundho — match? → User `isVerified: true` update
3. OTP delete karo (cleanup)
4. JWT token generate karke bhejo — user logged in ho jaata hai

**Key Concept:** JWT token `localStorage` mein store hota hai. Har API request mein `Authorization: Bearer <token>` header attach hota hai (Axios interceptor se).

---

## 🛡️ MIDDLEWARE — `server/middleware/auth.js`

### `protect` middleware:
- Request header se `Authorization: Bearer <token>` extract karta hai
- `jwt.verify(token, JWT_SECRET)` — token valid hai?
- Valid hai → `req.user` mein user object attach karo (password exclude)
- Invalid → 401 Unauthorized

### `admin` middleware:
- `protect` ke baad run hota hai
- `req.user.role === 'admin'` check karta hai
- Admin nahi → 403 Forbidden

**Usage:** `router.post('/', protect, admin, createEvent)` — pehle protect, phir admin check

---

## 🎪 EVENT MANAGEMENT — `server/controllers/eventController.js`

| Function | Route | Access | Kaam |
|---|---|---|---|
| `getEvents` | GET `/api/events` | Public | Search + category filter ke saath sab events |
| `getEventById` | GET `/api/events/:id` | Public | Single event detail |
| `createEvent` | POST `/api/events` | Admin only | Naya event create |
| `updateEvent` | PUT `/api/events/:id` | Admin only | Event edit |
| `deleteEvent` | DELETE `/api/events/:id` | Admin only | Event delete |

- `getEvents` mein `$regex` use hota hai case-insensitive search ke liye
- `createEvent` mein `availableSeats = totalSeats` set hota hai initially

---

## 🎟️ BOOKING SYSTEM — `server/controllers/bookingController.js`

### Complete Booking Flow:

```
User → Send OTP → Verify OTP → Booking Created (pending)
                                      ↓
                              Admin Dashboard
                                      ↓
                    Admin: "Send UPI Request" (paid) OR "Approve Free"
                                      ↓
                    ┌─────────────────┴──────────────────┐
                    ↓                                     ↓
              Free Event / Mark Paid              Paid Event (awaiting_payment)
              status: confirmed                          ↓
              Email sent ✓                    User: Pay Now → Enter TxnID
                                                          ↓
                                                   Send Payment OTP
                                                          ↓
                                                   Verify OTP → Confirmed
                                                   Email sent ✓
```

### Functions:

**`sendBookingOTP`** — POST `/api/bookings/send-otp`
- Logged-in user ke email pe 6-digit OTP bhejta hai
- Action: `event_booking`

**`bookEvent`** — POST `/api/bookings`
- OTP verify karta hai
- `persons` accept karta hai (default: 1)
- `availableSeats >= persons` check karta hai
- `amount = ticketPrice × persons` calculate karta hai
- Booking `pending` status mein create hoti hai
- OTP cleanup

**`confirmBooking`** — PUT `/api/bookings/:id/confirm` (Admin only)
- `paymentStatus: 'paid'` → directly confirm, seats deduct, email bhejo
- `paymentStatus: 'not_paid'` + paid event → `awaiting_payment`, payment instructions email
- `paymentStatus: 'not_paid'` + free event → confirm, seats deduct

**`sendPaymentOTP`** — POST `/api/bookings/:id/pay-otp`
- User payment karne se pehle OTP request karta hai
- Action: `payment_confirm`

**`payBooking`** — PUT `/api/bookings/:id/pay`
- OTP + txnId dono verify karta hai
- Payment confirm, booking confirmed, seats deduct
- Confirmation email bhejta hai

**`cancelBooking`** — DELETE `/api/bookings/:id`
- User apni booking cancel kar sakta hai
- Admin kisi bhi booking cancel kar sakta hai
- Agar booking `confirmed` thi → `availableSeats += persons` (seat wapas)

**`getMyBookings`** — GET `/api/bookings/my`
- User → sirf apni bookings
- Admin → saari bookings (populate with user + event details)

---

## 📧 EMAIL SYSTEM — `server/utils/email.js`

**Transporter:** Gmail SMTP (`smtp.gmail.com:587`) with App Password

### 3 Email Functions:

**`sendOTPEmail(email, otp, type)`**
- Types: `account_verification`, `event_booking`, `payment_confirm`
- Har type ka alag subject aur message hota hai
- HTML template with styled OTP box

**`sendBookingEmail(email, name, eventTitle, amount, paymentStatus, paymentDetails)`**
- Booking confirm hone par bheja jaata hai
- Free event → green "No payment required" section
- Paid → green "Payment received" section
- Not paid → yellow UPI payment instructions section

**`sendPaymentInstructionsEmail(email, name, eventTitle, amount, paymentDetails)`**
- Admin "Send UPI Request" click kare tab bheja jaata hai
- UPI ID, amount, aur QR code (generated via `api.qrserver.com`) include hota hai
- Direct UPI deep link: `upi://pay?pa=...&am=...` — PhonePe/GPay/Paytm se open hota hai

**Dev Mode:** Agar email configure nahi hai → console mein OTP print hota hai, email skip

---

## 🌐 FRONTEND PAGES — `client/src/pages/`

### `Home.jsx`
- **Debounced search** (350ms) — `useEffect` + `setTimeout` + `clearTimeout`
- **Category filter pills** — events ke categories se dynamically generate
- **Event cards** — image hover zoom, sold out overlay, 🔥 low seats badge
- **Location click** → Google Maps new tab mein khulta hai
- **Seats progress bar** — green/amber/red based on percentage

### `EventDetail.jsx`
- **Persons counter** — `+`/`-` buttons, max = `availableSeats`
- **Auto price calculation** — `ticketPrice × persons` live update
- **Sticky booking card** — `sticky top-6` CSS
- **Embedded Google Maps** — `<iframe>` with `maps.google.com/maps?q=...&output=embed`
- **View on Map button** → `window.open(google.com/maps/search/?api=1&query=...)` new tab
- **2-step booking** — OTP send → OTP verify → booking submit
- **Booked state** — button disabled, "✓ Request Sent" dikhta hai

### `UserDashboard.jsx`
- **PaymentModal** — 4 steps: `qr` → `scanning` → `confirm` → `otp` → `done`
  - **QR step:** Real UPI QR code (`api.qrserver.com`), UPI deep link, UPI ID display
  - **Scanning step:** Dummy phone frame UI, animated laser line, corner brackets, step checklist
  - **Confirm step:** TxnID input → "Get OTP" button
  - **OTP step:** 6-digit OTP verify → payment confirm
- **Pay Now button** — sirf tab dikhta hai jab `awaiting_payment` ya `confirmed + not_paid`
- **Persons count** — amount ke saath `(2 persons)` show hota hai

### `AdminDashboard.jsx`
- **2 Tabs:** Dashboard | Payment History
- **Analytics cards:** Total Revenue, Paid Clients, Pending Requests
- **Booking actions (pending only):**
  - "📲 Send UPI Request" → `confirmBooking(id, 'paid')` → payment instructions email
  - "✓ Approve Free" → `confirmBooking(id, 'not_paid')` → direct confirm
  - "✕ Reject" → cancel booking
- **Payment Settings modal** — UPI ID, name, QR image URL (localStorage mein save)
- **Payment History tab** — filter by paid/not_paid/free, search by user/event/txnId

### `Login.jsx` / `Register.jsx`
- Register → OTP sent → OTP verify screen
- Login → agar unverified → OTP screen
- JWT token localStorage mein store

---

## 🔄 AXIOS SETUP — `client/src/utils/axios.js`

```js
const api = axios.create({ baseURL: '/api' });

// Interceptor — har request mein token auto-attach
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
```

- `baseURL: '/api'` — Vite proxy use karta hai dev mein (port 5173 → 5000)
- Interceptor se manually token attach nahi karna padta har call mein

---

## 🔑 AUTH CONTEXT — `client/src/context/AuthContext.jsx`

- React Context API use karta hai — global state management
- `user` state — poori app mein available
- `login()`, `register()`, `verifyOTP()`, `resendOTP()`, `logout()` functions
- `localStorage` mein `userInfo` aur `token` persist hota hai
- Page refresh pe bhi user logged in rehta hai
- `loading` state — jab tak localStorage check na ho, children render nahi hote

---

## 🧭 ROUTING — `client/src/App.jsx`

| Route | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/events/:id` | EventDetail | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | UserDashboard | User only (frontend guard) |
| `/admin` | AdminDashboard | Admin only (frontend guard) |
| `*` | 404 Page | Public |

---

## 🗺️ MAP INTEGRATION

**No API key required** — Google Maps embed free hai basic use ke liye.

```js
// Embedded iframe (EventDetail page)
src={`https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed&z=15`}

// Open in new tab (Home + EventDetail)
window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank')
```

---

## 💳 UPI PAYMENT FLOW (No Gateway)

```
Admin UPI ID: 9431585217-3@ybl (stored in .env as UPI_ID)

UPI Deep Link format:
upi://pay?pa=<upiId>&pn=<name>&am=<amount>&cu=INR&tn=<note>

QR Code generation (free API):
https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=<encoded_upi_link>
```

- Koi payment gateway nahi (no Razorpay/Stripe)
- Admin manually payment verify karta hai
- User TxnID submit karta hai + OTP verify karta hai
- Admin dashboard mein TxnID visible hota hai

---

## 🔒 SECURITY FEATURES

1. **Password Hashing** — `bcrypt.hash(password, 10)` — plain password kabhi DB mein store nahi hota
2. **JWT Authentication** — stateless auth, 30 days expiry
3. **Role-Based Access** — `protect` + `admin` middleware — backend level guard
4. **2FA OTP — Account Verification** — register ke baad mandatory
5. **2FA OTP — Booking** — event book karne se pehle mandatory
6. **2FA OTP — Payment** — payment confirm karne se pehle mandatory
7. **OTP TTL** — MongoDB TTL index — 5 min mein auto-expire
8. **OTP Cleanup** — use hone ke baad `deleteOne()` se delete
9. **Overbooking Prevention** — `availableSeats >= persons` check backend mein
10. **Admin Lock** — admin role sirf DB mein set hota hai, register se nahi milta

---

## 📊 API ENDPOINTS SUMMARY

### Auth — `/api/auth`
```
POST /register          → Register user, send OTP
POST /login             → Login, return JWT
POST /verify-otp        → Verify account OTP
POST /resend-otp        → Resend account OTP
```

### Events — `/api/events`
```
GET  /                  → Get all events (search, category filter)
GET  /:id               → Get single event
POST /                  → Create event (Admin)
PUT  /:id               → Update event (Admin)
DELETE /:id             → Delete event (Admin)
```

### Bookings — `/api/bookings`
```
POST /send-otp          → Send booking OTP (User)
POST /                  → Create booking with OTP + persons (User)
GET  /my                → Get bookings (User: own, Admin: all)
PUT  /:id/confirm       → Confirm/reject booking (Admin)
POST /:id/pay-otp       → Send payment OTP (User)
PUT  /:id/pay           → Submit payment with OTP + txnId (User)
DELETE /:id             → Cancel booking (User/Admin)
```

---

## ⚙️ ENVIRONMENT VARIABLES — `server/.env`

```env
MONGO_URI=mongodb+srv://...     → MongoDB Atlas connection string
JWT_SECRET=supersecretkey       → JWT signing secret (keep strong)
EMAIL_USER=your@gmail.com       → Gmail address for sending emails
EMAIL_PASS=xxxx xxxx xxxx xxxx  → Gmail App Password (not regular password)
PORT=5000                       → Server port
UPI_ID=9431585217-3@ybl         → UPI ID for payments
UPI_NAME=Eventora Payments      → UPI display name
```

> Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords

---

## 🚀 HOW TO RUN

```bash
# From root folder
npm install
npm run install:all    # installs server + client dependencies
npm run dev            # starts both server (5000) + client (5173)
```

---

## 🎯 KEY INTERVIEW POINTS

1. **"Koi payment gateway kyun nahi use kiya?"**
   → Manual payment verification system banaya — admin UPI ID pe payment leta hai, TxnID verify karta hai. Real-world small event organizers ke liye practical solution.

2. **"JWT vs Session?"**
   → JWT stateless hai — server pe koi session store nahi hota. Scalable hai. Token client ke localStorage mein hota hai.

3. **"OTP expire kaise hota hai?"**
   → MongoDB TTL index use kiya — `expires: 300` (5 minutes). MongoDB automatically document delete karta hai.

4. **"Overbooking kaise rokate ho?"**
   → Backend mein `availableSeats >= persons` check hota hai booking create karne se pehle. Frontend pe bhi `+` button disable hota hai.

5. **"Admin kaise banta hai?"**
   → Sirf database mein manually `role: 'admin'` set karna padta hai. Register se koi admin nahi ban sakta — security ke liye.

6. **"Map kaise integrate kiya?"**
   → Google Maps embed URL use kiya — koi API key nahi chahiye basic embed ke liye. `maps.google.com/maps?q=location&output=embed`

7. **"Persons feature kaise kaam karta hai?"**
   → Frontend mein counter se `persons` select hota hai, `amount = ticketPrice × persons` live calculate hota hai. Backend mein `persons` store hota hai aur seats bhi utni hi deduct hoti hain.
