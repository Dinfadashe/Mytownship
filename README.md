# MyTownship — Hotel Management & Logistics App

> Hotel Management & Logistics | Services Connected  
> Powered by Charity Token (CHAR)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Email | Resend |
| Payments | Paystack / Flutterwave + Charity Token |
| Deploy | Netlify (GitHub auto-deploy, master branch) |

---

## Quick Setup

### 1. Clone & install dependencies

```bash
git clone <your-repo-url>
cd mytownship
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run `supabase/schema.sql` (copy-paste the entire file)
3. Copy your project URL and keys from Settings → API

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your actual keys
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Run the development server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
mytownship/
├── app/
│   ├── page.tsx                    # Homepage / landing
│   ├── layout.tsx                  # Root layout (fonts, providers)
│   ├── globals.css                 # Brand theme (steel-blue palette)
│   ├── auth/
│   │   ├── login/page.tsx          # Sign in
│   │   ├── register/page.tsx       # Create account
│   │   └── forgot-password/page.tsx
│   ├── hotels/
│   │   ├── page.tsx                # Hotel listing with filters
│   │   └── [id]/page.tsx           # Hotel detail + booking form
│   ├── logistics/
│   │   └── page.tsx                # Ship + track packages
│   └── dashboard/
│       └── bookings/page.tsx       # User dashboard
│
├── components/
│   ├── layout/navbar.tsx           # Top navigation (auth-aware)
│   ├── hotel/
│   │   ├── hotel-card.tsx          # Hotel listing card
│   │   └── hotel-filters.tsx       # City/stars sidebar filter
│   ├── booking/
│   │   └── booking-form.tsx        # Room booking with payment method
│   └── logistics/
│       ├── new-shipment-form.tsx   # Create shipment
│       └── track-shipment.tsx      # Tracking by code
│
├── lib/supabase/
│   ├── client.ts                   # Browser Supabase client
│   └── server.ts                   # Server Supabase client + admin
│
├── types/database.ts               # Full TypeScript DB types
├── middleware.ts                   # Auth route protection
└── supabase/schema.sql             # Complete DB schema + RLS policies
```

---

## Key Features Built (Phase 1)

- **Auth**: Register, login, forgot password, email verification
  - Roles: `user`, `admin`, `hotel_manager`, `logistics_agent`
  - JWT sessions via Supabase Auth
  - Auto-creates profile on signup

- **Hotels**: Browse hotels with city/star filters, hotel detail page, room selection

- **Booking**: Date picker, guest count, payment method (Paystack, Flutterwave, CHAR Token, Bank Transfer), price breakdown

- **Logistics**: Create shipments with auto-generated tracking codes, real-time tracking by code, shipment timeline events

- **Dashboard**: Booking history, shipment history, profile, stats

---

## Phase 2 — Next Steps

- [ ] Admin dashboard (hotel management, booking oversight)
- [ ] Paystack webhook payment confirmation
- [ ] Email notifications via Resend (booking confirmations, shipment updates)
- [ ] Hotel image uploads to Supabase Storage
- [ ] Review & rating system
- [ ] Charity Token (CHAR) wallet integration

## Phase 3

- [ ] Full CHAR token payment flow
- [ ] Mobile PWA polish
- [ ] SEO & meta optimization
- [ ] Analytics dashboard

---

## Netlify Deployment

1. Push to GitHub (master branch)
2. Connect repo in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add all environment variables in Netlify site settings

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles extending Supabase auth |
| `hotels` | Hotel listings with amenities, images, location |
| `rooms` | Rooms per hotel with pricing and availability |
| `bookings` | Hotel reservations with payment tracking |
| `reviews` | Guest reviews linked to completed bookings |
| `shipments` | Logistics shipments with tracking codes |
| `shipment_events` | Timeline events for each shipment |

All tables have Row Level Security (RLS) policies enabled.

---

Built with ❤️ for Web3.0 Alliance Ltd · Charity Token Project
