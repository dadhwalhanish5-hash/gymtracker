# 💪 GymTracker — Om & Pinky

A premium, production-ready gym progression tracker built with Next.js 15, Supabase, and Tailwind CSS.

---

## 🚀 Features

- **Custom Exercise Library** — Create any exercise with muscle group, equipment, type
- **Workout Logger** — Log sets, reps, weight, RPE per exercise
- **Progress Analytics** — Charts for volume, weekly sessions, muscle frequency
- **Body Stats Tracking** — Weight, measurements, body fat over time
- **Calendar View** — Monthly heatmap of workouts and rest days
- **Rest Day Logging** — Track recovery with sleep and energy level
- **Workout Templates** — Push/Pull/Legs presets + custom templates
- **Personal Records** — Auto-detected estimated 1RM per exercise
- **Rest Timer** — Floating countdown between sets
- **Dark Mode Only** — Premium dark UI with glass effects and gradients

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |

---

## 🛠 Local Setup (Step by Step)

### 1. Clone / open in VS Code

```bash
# In VS Code terminal (Ctrl + `)
cd gymtracker
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it "gymtracker", set a database password
3. Wait for it to initialize (~1 min)

### 3. Run the Database Schema

1. In Supabase dashboard → SQL Editor
2. Open file: `supabase/schema.sql`
3. Copy everything → Paste in SQL editor → Run

### 4. Create Test Users

In Supabase → Authentication → Users → Add User:
- `om@gymtracker.app` / `yourpassword`
- `pinky@gymtracker.app` / `yourpassword`

After creating users, run in SQL Editor:
```sql
-- Seed exercises for Om (replace the UUID with Om's actual user ID from Auth > Users)
SELECT seed_default_exercises('Om-user-id-here');
SELECT seed_default_exercises('Pinky-user-id-here');
```

### 5. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from: Supabase → Settings → API

### 6. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🌐 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables (same as .env.local)
4. Deploy!

---

## 📁 Project Structure

```
gymtracker/
├── app/                    # Pages (Next.js App Router)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Root redirect
│   ├── login/              # Login page
│   └── dashboard/          # All authenticated pages
│       ├── layout.tsx      # Dashboard layout (auth check)
│       ├── page.tsx        # Dashboard home
│       ├── exercises/      # Exercise library
│       ├── workouts/       # Workout list + logger + detail
│       ├── analytics/      # Charts and stats
│       ├── calendar/       # Monthly calendar
│       ├── body-stats/     # Body measurements
│       └── templates/      # Workout templates
├── components/
│   ├── layout/
│   │   └── AppShell.tsx    # Sidebar + navigation
│   └── ui/
│       └── RestTimerWidget.tsx
├── lib/
│   ├── store.ts            # Zustand global state
│   └── supabase/           # DB clients
├── types/
│   └── database.ts         # TypeScript types
├── utils/
│   └── helpers.ts          # Utility functions
├── supabase/
│   └── schema.sql          # Full DB schema
└── middleware.ts            # Auth protection
```

---

## 💡 Learning Notes (for Om)

### Key Concepts Used:

**TypeScript** — Every variable has a type. `const name: string = 'Om'` prevents bugs.

**React Server Components** — Pages like `dashboard/page.tsx` run on the server. They fetch data BEFORE sending HTML to browser. Faster and more secure.

**Client Components** — Files with `'use client'` at top run in the browser. Needed for interactivity (clicks, forms, animations).

**Supabase Row Level Security (RLS)** — Database rules that say "user can only see their own rows." Super important for multi-user apps.

**Zustand** — A tiny store for sharing state (like the timer) across components without passing props everywhere.

**Framer Motion** — Animation library. `initial` = start state, `animate` = end state. The library smoothly transitions between them.

---

## 🔮 Future Additions

- [ ] Progression charts per exercise (see if bench press improved)
- [ ] AI-generated workout summaries
- [ ] Progress photos
- [ ] Barbell plate calculator
- [ ] Export data as CSV
- [ ] PWA (install as mobile app)
