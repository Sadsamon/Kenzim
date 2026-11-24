# Kenzim

An installable progressive web app for the Kenyan community in Zimbabwe: one
platform for membership, communication, events, and a community marketplace,
deployable entirely on free-tier cloud infrastructure.

**Live:** https://kenzim-blue.vercel.app

## Features

- **Installable PWA** — installs on mobile and desktop, with a graceful
  fallback when connectivity drops
- **Member management** — Supabase Auth and PostgreSQL back a multi-level role
  hierarchy, with an administrative approval workflow for new members
- **Dues tracking** for membership contributions
- **Events** with RSVP registration and photo galleries
- **News** publishing for community announcements
- **Member directory**
- **Marketplace** for community goods
- **Interactive community map** built on Leaflet and OpenStreetMap

## Stack

Next.js, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), Leaflet with
OpenStreetMap, Vercel

Built to run entirely on free tiers (Vercel, Supabase, OpenStreetMap), with a
straightforward path to paid tiers as the community grows.

## Getting started

```bash
npm install
cp .env.example .env.local    # add your Supabase project URL and keys
npm run dev
```

Open http://localhost:3000.

The database schema lives in `supabase/migrations/`. Apply it with the
Supabase CLI (`supabase db push`) or by running the migration files in the
Supabase SQL editor.

## Design targets

- Under 2 seconds average page load on 4G
- 95%+ availability on free-tier infrastructure
- Headroom for 5,000+ members without architectural changes

## License

See the repository for license information.
