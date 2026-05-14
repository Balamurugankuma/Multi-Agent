# Velverse AI — Backend API

**Node.js · Express · MongoDB · JWT · Razorpay · Flowise AI**

Saraswathy College of Engineering and Technology  
Department of CSE — B.E. Final Year Project · 2025–26  
Team: Aakash.V · Adhi.L · KalimuthGopinath.G.K · U.S  
Guide: Mr. E. Subash

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your real values

# 3. Seed default services (run once)
node config/seed.js

# 4. Start development server
npm run dev

# 5. Server runs at → http://localhost:5000
```

---

## Project Structure

```
velverse-backend/
├── server.js                 ← Express app + middleware setup
├── package.json
├── .env.example              ← Copy to .env and fill values
│
├── config/
│   ├── db.js                 ← MongoDB (Mongoose) connection
│   ├── razorpay.js           ← Razorpay SDK instance
│   └── seed.js               ← Seed default services/admin
│
├── models/
│   ├── User.js               ← Users collection (bcrypt hashing)
│   ├── Payment.js            ← Payments collection (Razorpay + Stripe)
│   ├── Service.js            ← Services / plans collection
│   └── ChatHistory.js        ← AI chat history collection
│
├── middleware/
│   ├── auth.js               ← JWT protect + adminOnly + generateToken
│   ├── errorHandler.js       ← Global error handler + createError()
│   └── validate.js           ← express-validator runner
│
├── controllers/
│   ├── authController.js     ← signup · login · googleAuth · getMe
│   ├── userController.js     ← getProfile · updateProfile · changePassword
│   ├── paymentController.js  ← Razorpay + Stripe order/verify
│   ├── aiController.js       ← Flowise AI chat + history
│   └── serviceController.js  ← Services CRUD
│
└── routes/
    ├── authRoutes.js         ← /api/auth/*
    ├── userRoutes.js         ← /api/user/*
    ├── paymentRoutes.js      ← /api/payment/*
    ├── aiRoutes.js           ← /api/ai/*
    └── serviceRoutes.js      ← /api/services/*
```

---

## How Authentication Works

```
┌──────────┐   POST /signup or /login   ┌─────────────┐
│ Frontend │ ─────────────────────────► │   Express   │
│ (React)  │                            │   Server    │
└──────────┘                            └──────┬──────┘
                                               │ 1. Validate input
                                               │ 2. bcrypt.compare(password, hash)
                                               │ 3. jwt.sign({ id: userId })
                                               ▼
                                        ┌─────────────┐
                                        │  JWT Token  │
                                        │ returned    │
                                        └──────┬──────┘
                                               │
                 ◄──────────── token ──────────┘

For protected routes:
  Authorization: Bearer <token>
       │
       ▼
  JWT middleware verifies → attaches req.user → next()
```

**Password hashing:** bcrypt with 12 salt rounds  
**Token lifetime:** 7 days (configurable via `JWT_EXPIRES_IN`)

---

## How Razorpay Payment Works

```
Frontend                    Backend                  Razorpay
   │                           │                        │
   │ POST /payment/razorpay/   │                        │
   │ create-order              │                        │
   │ ─────────────────────────►│                        │
   │                           │ razorpay.orders.create │
   │                           │ ──────────────────────►│
   │                           │◄── { order_id, amount }│
   │◄── order_id, key_id ──────│                        │
   │                           │                        │
   │ [User pays in Razorpay    │                        │
   │  Checkout modal]          │                        │
   │                           │                        │
   │ POST /payment/razorpay/   │                        │
   │ verify                    │                        │
   │ (order_id, payment_id,    │                        │
   │  signature)               │                        │
   │ ─────────────────────────►│                        │
   │                           │ HMAC-SHA256 verify     │
   │                           │ Update DB → paid       │
   │                           │ Upgrade user.plan      │
   │◄── { success, plan } ─────│                        │
```

---

## How Flowise AI Integration Works

```
Frontend              Backend               Flowise AI Cloud
   │                     │                        │
   │ POST /api/ai/chat   │                        │
   │ { agentType,        │                        │
   │   message }         │                        │
   │ ───────────────────►│                        │
   │                     │ Look up flow ID        │
   │                     │ from .env              │
   │                     │                        │
   │                     │ POST /api/v1/prediction│
   │                     │ /{flowId}              │
   │                     │ { question: message }  │
   │                     │ ──────────────────────►│
   │                     │                        │ LLM processes
   │                     │◄── { text: "..." } ────│
   │                     │                        │
   │                     │ Save to ChatHistory DB │
   │◄── { response } ────│                        │
```

---

## Complete API Reference

### Authentication APIs

#### POST /api/auth/signup
Register a new user.

**Request:**
```json
{
  "name": "Aakash V",
  "email": "aakash@example.com",
  "password": "MyPassword123"
}
```

**Response 201:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Aakash V",
    "email": "aakash@example.com",
    "role": "user",
    "plan": "Starter",
    "createdAt": "2026-03-16T10:00:00.000Z"
  }
}
```

---

#### POST /api/auth/login
Login existing user → returns JWT.

**Request:**
```json
{
  "email": "aakash@example.com",
  "password": "MyPassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Aakash V",
    "email": "aakash@example.com",
    "plan": "Starter"
  }
}
```

**Error 401:**
```json
{ "success": false, "message": "Invalid email or password." }
```

---

#### POST /api/auth/google
Login / register with Google OAuth.

**Request:**
```json
{ "idToken": "google_id_token_from_frontend_sdk" }
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "name": "Aakash V", "email": "aakash@gmail.com", "avatar": "https://..." }
}
```

---

#### GET /api/auth/me *(protected)*
Returns the currently logged-in user.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "user": { "_id": "...", "name": "Aakash V", "email": "...", "plan": "Pro" }
}
```

---

### User Management APIs

#### GET /api/user/profile *(protected)*

**Response 200:**
```json
{
  "success": true,
  "user": { "name": "Aakash V", "email": "...", "plan": "Pro" },
  "stats": { "totalPayments": 2, "totalChats": 47 }
}
```

---

#### PUT /api/user/profile *(protected)*

**Request:**
```json
{ "name": "Aakash Velverse" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "user": { "name": "Aakash Velverse", "email": "..." }
}
```

---

#### PUT /api/user/change-password *(protected)*

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Response 200:**
```json
{ "success": true, "message": "Password changed successfully." }
```

---

### Payment APIs

#### POST /api/payment/razorpay/create-order *(protected)*

**Request:**
```json
{ "plan": "Pro", "currency": "INR", "period": "monthly" }
```

**Response 201:**
```json
{
  "success": true,
  "order": {
    "id": "order_OgFxxxxxxxxxxx",
    "amount": 249900,
    "currency": "INR",
    "status": "created"
  },
  "key": "rzp_test_xxxxxxxxxxxxxx",
  "prefill": { "name": "Aakash V", "email": "aakash@example.com" }
}
```

---

#### POST /api/payment/razorpay/verify *(protected)*
Verifies payment after Razorpay checkout completes.

**Request:**
```json
{
  "razorpay_order_id":   "order_OgFxxxxxxxxxxx",
  "razorpay_payment_id": "pay_OgFxxxxxxxxxxx",
  "razorpay_signature":  "hmac_sha256_signature_here"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Payment verified successfully.",
  "paymentId": "pay_OgFxxxxxxxxxxx",
  "plan": "Pro"
}
```

**Error 400 (bad signature):**
```json
{ "success": false, "message": "Payment verification failed. Invalid signature." }
```

---

#### GET /api/payment/history *(protected)*

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "payments": [
    {
      "_id": "...",
      "serviceName": "Velverse AI Pro Plan",
      "amount": 2499,
      "currency": "INR",
      "status": "paid",
      "gateway": "razorpay",
      "date": "2026-03-16T10:30:00.000Z"
    }
  ]
}
```

---

### AI Integration APIs

#### POST /api/ai/chat *(protected)*
Send a message to a Flowise AI squad agent.

**Request:**
```json
{
  "agentType": "software",
  "message":   "Build me a REST API for user authentication in Node.js",
  "sessionId": "session_uuid_here"
}
```

**Response 200:**
```json
{
  "success": true,
  "response": "Here is a complete Node.js authentication REST API using Express and JWT...",
  "sessionId": "session_uuid_here",
  "agentType": "software",
  "responseTimeMs": 3241,
  "saved": true,
  "chatId": "664f1a2b3c4d5e6f7a8b9c0e"
}
```

**Valid agentType values:** `software` · `web` · `uiux` · `marketing` · `data`

---

#### GET /api/ai/history *(protected)*

**Query params:** `?agentType=software&limit=20&page=1`

**Response 200:**
```json
{
  "success": true,
  "total": 47,
  "page": 1,
  "pages": 3,
  "history": [
    {
      "agentType": "software",
      "message":   "Build me a REST API...",
      "response":  "Here is a complete...",
      "timestamp": "2026-03-16T10:30:00.000Z"
    }
  ]
}
```

---

#### GET /api/ai/agents *(protected)*
List all squads and their configuration status.

**Response 200:**
```json
{
  "success": true,
  "agents": [
    { "key": "software",  "name": "Software Dev Squad",    "configured": true  },
    { "key": "web",       "name": "Web Dev Squad",         "configured": false },
    { "key": "uiux",      "name": "UI/UX Design Squad",   "configured": false },
    { "key": "marketing", "name": "Digital Marketing Squad", "configured": false },
    { "key": "data",      "name": "Data Analysis Squad",  "configured": false }
  ]
}
```

---

## MongoDB Collections

### Users
| Field | Type | Notes |
|-------|------|-------|
| name | String | Required |
| email | String | Unique, lowercase |
| password | String | bcrypt hashed, hidden by default |
| role | String | `user` or `admin` |
| plan | String | `Starter`, `Pro`, `Enterprise` |
| googleId | String | For Google OAuth users |
| avatar | String | Profile picture URL |
| lastLogin | Date | Updated on every login |
| createdAt | Date | Auto (timestamps) |

### Payments
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId | Ref → Users |
| serviceName | String | e.g. "Velverse AI Pro Plan" |
| plan | String | `Starter`, `Pro`, `Enterprise` |
| amount | Number | In rupees (not paise) |
| currency | String | `INR`, `USD` |
| razorpayOrderId | String | From Razorpay |
| razorpayPaymentId | String | After payment |
| razorpaySignature | String | Verification hash |
| status | String | `created`, `paid`, `failed` |
| gateway | String | `razorpay` or `stripe` |
| date | Date | Payment timestamp |

### Services
| Field | Type | Notes |
|-------|------|-------|
| serviceName | String | Unique plan name |
| description | String | Plan description |
| price.monthly | Number | Monthly price in INR |
| price.annual | Number | Annual price in INR |
| category | String | `subscription`, `one-time` |
| features | [String] | Feature list |
| squads | [String] | Included squads |
| isActive | Boolean | Show/hide plan |

### ChatHistory
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId | Ref → Users |
| agentType | String | `software`, `web`, etc. |
| sessionId | String | Conversation grouping |
| message | String | User's prompt |
| response | String | AI's response |
| responseTimeMs | Number | Flowise response time |
| timestamp | Date | When message was sent |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/velverse_ai
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
FLOWISE_BASE_URL=https://cloud.flowiseai.com
FLOWISE_API_KEY=your_flowise_key
FLOWISE_SOFTWARE_ID=009c3c44-c388-4734-bf25-3fe82655778c
CLIENT_URL=http://localhost:3000
```

---

## Frontend Integration (React)

```javascript
// 1. Login and store token
const res = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await res.json();
localStorage.setItem('vv_token', token);

// 2. Authenticated request
const profile = await fetch('http://localhost:5000/api/user/profile', {
  headers: { Authorization: `Bearer ${localStorage.getItem('vv_token')}` }
});

// 3. AI Chat
const chat = await fetch('http://localhost:5000/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('vv_token')}`
  },
  body: JSON.stringify({ agentType: 'software', message: 'Build a login API' })
});
const { response } = await chat.json();
```
