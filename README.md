# ProposalAI — Complete Setup & Deployment Guide

AI-powered proposal generator for freelancers, agencies, and consultants.

---

## Architecture Overview

```
Frontend (Next.js 14)    →    Backend (Express.js)    →    PostgreSQL (Prisma)
     Vercel                      Render / Railway             Supabase / Neon

                              OpenAI GPT-4o
                              Stripe Payments
                              PDFKit Generation
```

---

## Project Structure

```
proposalai/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── dashboard/           # Protected dashboard pages
│   │   │   ├── page.tsx         # Dashboard home + stats
│   │   │   ├── layout.tsx       # Auth guard + sidebar layout
│   │   │   ├── proposals/
│   │   │   │   ├── page.tsx     # Proposals list + search/filter
│   │   │   │   ├── generate/    # AI proposal generator form
│   │   │   │   └── [id]/        # Proposal editor
│   │   │   ├── clients/         # Client management (CRUD)
│   │   │   ├── pricing/         # Subscription plans + Stripe
│   │   │   └── settings/        # User profile settings
│   │   ├── login/               # Auth pages
│   │   ├── signup/
│   │   └── share/[token]/       # Public proposal viewer
│   ├── components/
│   │   ├── layout/              # Sidebar, TopBar
│   │   └── ui/                  # Toaster, shared UI
│   ├── lib/
│   │   ├── api.ts               # Axios client + interceptors
│   │   ├── store/auth.store.ts  # Zustand auth state
│   │   └── utils.ts
│   └── hooks/use-toast.ts
│
└── backend/                     # Express.js API
    ├── src/
    │   ├── index.js             # Server entry + middleware setup
    │   ├── controllers/
    │   │   ├── auth.controller.js      # Signup, login, refresh, me
    │   │   ├── proposal.controller.js  # Full CRUD + generate + PDF
    │   │   └── client.controller.js    # Client CRUD
    │   ├── routes/              # Express router files
    │   ├── services/
    │   │   ├── ai.service.js    # OpenAI GPT-4o integration
    │   │   ├── pdf.service.js   # PDFKit document generation
    │   │   ├── stripe.service.js # Subscriptions + webhooks
    │   │   └── usage.service.js # Plan limits + tracking
    │   ├── middleware/
    │   │   ├── auth.middleware.js  # JWT verification
    │   │   └── error.middleware.js # Global error handler
    │   ├── config/prisma.js     # Prisma client singleton
    │   └── utils/logger.js      # Winston logger
    └── prisma/
        └── schema.prisma        # Database schema
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)
- OpenAI API key
- Stripe account

### 1. Database Setup

Create a PostgreSQL database. Options:
- **Local**: `createdb proposalai`
- **Supabase**: https://supabase.com (free tier available)
- **Neon**: https://neon.tech (free tier available)

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# Generate Prisma client
npm run db:generate

# Run migrations / push schema
npm run db:push

# Start development server
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev
# App runs on http://localhost:3000
```

---

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/proposalai

# JWT — generate strong random strings (32+ chars)
JWT_SECRET=your-secret-here-min-32-characters
JWT_REFRESH_SECRET=different-secret-for-refresh-tokens

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...      # Create in Stripe Dashboard
STRIPE_AGENCY_PRICE_ID=price_...   # Create in Stripe Dashboard
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Stripe Setup

1. Create a Stripe account at https://stripe.com

2. Create Products & Prices in Stripe Dashboard:
   - **Pro Plan**: $29/month recurring
   - **Agency Plan**: $99/month recurring

3. Copy the Price IDs (price_xxx) to your `.env`

4. For webhooks (local testing):
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   
   # Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET
   ```

5. For production, add webhook endpoint in Stripe Dashboard:
   - URL: `https://your-api.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

---

## Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-api.render.com/api
```

Or connect GitHub repo to Vercel for automatic deployments.

### Backend → Render

1. Create account at https://render.com
2. New Web Service → Connect GitHub repo
3. Settings:
   - **Build Command**: `npm install && npm run db:generate && npm run db:migrate`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add all environment variables from `.env`

### Backend → Railway

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up

# Set environment variables:
railway variables set DATABASE_URL=...
railway variables set JWT_SECRET=...
# etc.
```

### Database → Supabase

1. Create project at https://supabase.com
2. Go to Settings → Database → Connection String
3. Copy URI and set as `DATABASE_URL`
4. Run: `npm run db:migrate`

### Database → Neon

1. Create project at https://neon.tech
2. Copy connection string
3. Set as `DATABASE_URL` (append `?sslmode=require` if needed)
4. Run: `npm run db:migrate`

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposals` | List proposals (paginated, searchable) |
| POST | `/api/proposals/generate` | **AI generate** proposal |
| POST | `/api/proposals` | Create blank proposal |
| GET | `/api/proposals/stats` | Dashboard statistics |
| GET | `/api/proposals/:id` | Get single proposal |
| PATCH | `/api/proposals/:id` | Update proposal |
| DELETE | `/api/proposals/:id` | Delete proposal |
| POST | `/api/proposals/:id/duplicate` | Duplicate proposal |
| POST | `/api/proposals/:id/share` | Toggle public sharing |
| GET | `/api/proposals/:id/pdf` | Download PDF |
| GET | `/api/proposals/share/:token` | Get shared proposal (public) |

### Clients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client |
| GET | `/api/clients/:id` | Get client + proposals |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/plans` | Get all plans |
| GET | `/api/subscriptions/usage` | Get usage summary |
| POST | `/api/subscriptions/checkout` | Create Stripe checkout |
| POST | `/api/subscriptions/portal` | Create billing portal |

---

## Database Schema

Key tables:

- **users** — Auth, profile, role
- **clients** — Client profiles linked to users
- **proposals** — Full proposal content (7 sections), metadata, sharing
- **subscriptions** — Stripe subscription data, plan type
- **usage_logs** — Monthly usage tracking for plan limits

---

## Subscription Plans

| Feature | Free | Pro ($29/mo) | Agency ($99/mo) |
|---------|------|--------------|-----------------|
| Proposals/month | 5 | 100 | Unlimited |
| Templates | All | All | All |
| PDF Export | ✓ | ✓ | ✓ |
| Proposal Sharing | ✓ | ✓ | ✓ |
| Team Features | — | — | Coming soon |

---

## Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT**: Short-lived access tokens (7d) + refresh tokens (30d)
- **Rate limiting**: Global (200 req/15min), Auth (20/15min), AI (5/min)
- **CORS**: Configured for specific frontend origin only
- **Helmet.js**: Security headers
- **Input validation**: express-validator on all inputs
- **SQL injection**: Protected via Prisma ORM
- **XSS**: Headers via Helmet

---

## Extending the Platform

### Adding New Templates
In `backend/src/services/ai.service.js`, add to `TEMPLATE_CONTEXTS`:
```js
MY_TEMPLATE: "Context for the AI to specialize the proposal...",
```

In frontend, add to `TEMPLATES` array in the generate page.

### Adding New Proposal Sections
1. Add field to `proposals` table in `prisma/schema.prisma`
2. Run `prisma migrate`
3. Update `proposal.controller.js` allowedFields
4. Add to `SECTIONS` array in the editor page

### Admin Panel
Admin routes are scaffolded at `/api/admin/*`. Set `role: "ADMIN"` in the database to access them.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, Zustand |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| AI | OpenAI GPT-4o |
| Payments | Stripe Subscriptions |
| PDF | PDFKit |
| Logging | Winston |
| Deployment | Vercel + Render/Railway + Supabase/Neon |
#   P r o p o s a l A I  
 