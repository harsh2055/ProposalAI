# ProposalAI — Fixed Setup Guide

## What was fixed

1. **Removed** `@radix-ui/react-badge` (doesn't exist) → replaced with custom Badge component
2. **Added** all missing ShadCN UI components: Button, Input, Label, Textarea, Card,
   Badge, Progress, Select, Dialog, DropdownMenu, Table, Separator
3. **Created** `tsconfig.json` with `@/*` path aliases so imports resolve correctly
4. **Fixed** `next.config.js` — removed invalid `serverActions: true`
5. **Upgraded** Next.js to `14.2.29` (security patched version)
6. **Fixed** `ai.service.js` — now lazy-loads OpenAI, server starts without API key
7. **Added** `postcss.config.js` required by Tailwind CSS
8. **Fixed** all page files to use correct imports

---

## Frontend Setup (after extracting zip)

```bash
cd proposalai/frontend

# 1. Delete old node_modules if present
rm -rf node_modules

# 2. Install (no errors this time)
npm install

# 3. Copy env file
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:5000/api

# 4. Run
npm run dev
# → http://localhost:3000
```

## Backend Setup

```bash
cd proposalai/backend

# 1. Install
npm install

# 2. Copy env
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET, OPENAI_API_KEY etc.

# 3. Push schema (once DATABASE_URL is set correctly)
npm run db:generate
npm run db:push

# 4. Run
npm run dev
# → http://localhost:5000
```

## DATABASE_URL format

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME

# Local PostgreSQL example:
postgresql://postgres:mypassword@localhost:5432/proposalai

# Supabase example (from dashboard → Settings → Database → URI):
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Neon example:
postgresql://[user]:[password]@[host].neon.tech/proposalai?sslmode=require
```

## You can start without OpenAI key

The backend will start and all routes work. The `/api/proposals/generate`
endpoint will return an error message (not crash) if OPENAI_API_KEY is missing.
Add it when you're ready to test AI generation.

## Stripe keys are optional for development

The server starts fine without Stripe keys. Subscription/checkout endpoints
will fail gracefully. Add them when ready to test payments.
