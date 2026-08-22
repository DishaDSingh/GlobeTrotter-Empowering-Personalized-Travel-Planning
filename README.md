Frontend Link = "globe-trotter-empowering-personaliz-ten.vercel.app"
Backend Link = "https://globetrotter-api-knjd.onrender.com"
# GlobeTrotter

**Plan smarter. Travel better.**

GlobeTrotter is a personalized multi-city travel-planning platform. Discover destinations, build
day-by-day itineraries, manage a per-trip and per-city budget, view everything on a map/calendar,
and share your trip publicly for others to copy.

## Features

- **Auth** — email/password signup & login (JWT), forgot/reset password, protected routes
- **Dashboard** — greeting, upcoming trips, budget overview (grouped by currency), quick actions,
  seasonal & personalized recommendations
- **Destinations & activities** — search/filter by country, budget, popularity; weather via
  Open-Meteo; category-based activity browsing
- **Trips** — create, edit, duplicate, delete; draft/planned/completed status; public/private
  visibility with shareable links
- **Itinerary builder** — drag-and-drop reordering (day-by-day, per city), add/edit/duplicate/
  delete activities, custom cost & notes, per-day totals
- **Map** — every destination and activity plotted on an interactive Leaflet/OpenStreetMap view,
  with the route between cities drawn in
- **Calendar & Timeline** — two ways to view the same itinerary
- **Budget** — total/spent/remaining/average-daily-cost, spend-by-category pie chart, city-by-city
  planned-vs-actual chart, spend-over-time chart, over-budget alerts
- **Trip Guide** — say a destination and trip length (e.g. "Rome, 30 days") and get a suggested
  multi-city route within the same country, with days allocated per city and a full cost
  breakdown (accommodation, food, local transport, inter-city train/flight, activities) using
  each city's real price level and real listed activity prices; hands off straight into Create
  Trip with destinations, dates, budget, and activities all pre-filled
- **Budget-first AI trip planner** — describe a destination, duration, and budget (no account
  required) and get a structured day-by-day plan back; works without any API key via a rule-based
  generator, and upgrades automatically to a real LLM if `OPENAI_API_KEY` is set
- **AI budget optimizer** — analyzes an existing trip and suggests concrete ways to cut cost;
  never edits the itinerary itself, only proposes changes
- **Seasonal recommendations** — "Best places to visit this {season}", ranked by real seasonal
  travel windows per destination (not just popularity)
- **Sharing** — public trip pages at `/trip/share/:id`, with a "Copy this itinerary" action
- **Profile & Settings** — travel preferences, saved destinations, notifications, privacy
  defaults, password change, account deletion
- **Admin dashboard** — platform-wide stats, user growth, popular cities/activities

## Tech stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React
Hook Form + Zod, Recharts, Framer Motion, dnd-kit, Leaflet/react-leaflet, Lucide icons, Sonner
(toasts).

**Backend:** FastAPI, SQLAlchemy 2.0, Pydantic v2, JWT auth (`python-jose` + `bcrypt`), httpx for
outbound calls (Open-Meteo, optionally OpenAI).

**Database:** SQLite by default (zero setup) — swap `DATABASE_URL` for PostgreSQL/Supabase in
production; the schema is portable (no SQLite-only features are used).

## Architecture

```
frontend/                React app (Vite)
  src/
    components/          Reusable UI: layout, ui primitives, destinations, activities,
                          itinerary, trips, map
    pages/                One file per route (Landing, Dashboard, Explore, MyTrips,
                          CreateTrip, TripDetails, SharedTrip, Profile, Settings, Admin, ...)
    hooks/                TanStack Query hooks per resource (useTrips, useBudget, useAI, ...)
    context/              AuthContext (JWT session, current user)
    lib/                  api client, image helpers, pending-AI-plan bridge, utils
    types/                Shared TypeScript types mirroring the backend schemas

backend/
  app/
    api/                  One router per resource (auth, users, destinations, activities,
                          trips, shared, ai, admin)
    models/               SQLAlchemy models
    schemas/              Pydantic request/response schemas
    services/             Business logic: budget calculations, weather, AI generation/
                          optimization, recommendation scoring (personalized + seasonal)
    auth/                 JWT + password hashing + FastAPI dependencies
    database/             Engine/session setup
  tests/                  pytest suite (auth, trips, ownership, itinerary, budget, sharing, AI)

scripts/
  seed_demo_data.py       Populates destinations/activities/demo users/sample trips
  import_cities.py        Generic CSV -> destinations importer (e.g. a GeoNames export)
  import_activities.py    Generic CSV -> activities importer (e.g. an OpenTripMap export)
```

## Database schema

Core tables: `users`, `destinations`, `activities`, `trips`, `trip_stops`,
`itinerary_activities`, `budget_records`.
Supporting tables: `saved_destinations`, `trip_collaborators`, `notifications`,
`user_preferences`, `password_reset_tokens`.

Notable fields:
- `trips.share_id` — a random UUID assigned when a trip is made public; the public URL is
  `/trip/share/{share_id}`.
- `trip_stops.planned_budget` — an optional per-city budget allocation, shown against actual
  itinerary spend in the Budget tab's city breakdown.
- `itinerary_activities.custom_cost` — overrides the activity's catalog price for this specific
  occurrence (e.g. a group discount).

Tables are created automatically on backend startup via `SQLAlchemy.metadata.create_all()` — there
is no separate migration step needed for local development. For a production Postgres/Supabase
deployment, run the same backend once against that database to create the schema, or introduce
Alembic if you need versioned migrations going forward.

## Environment variables

Copy `.env.example` to `.env` (both at the repo root and inside `backend/`, or point
`pydantic-settings` at the root one) and fill in what you need:

```bash
cp .env.example backend/.env
cp .env.example .env   # only VITE_API_URL is read from here by the frontend
```

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | No | Defaults to `sqlite:///./globetrotter.db`. Set to a Postgres/Supabase URL for production. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | No | Only needed if you point `DATABASE_URL` at Supabase Postgres. Never expose the service-role key to the frontend. |
| `MAPBOX_TOKEN` | No | The map uses Leaflet + OpenStreetMap by default (no key needed). Unused unless you wire in a Mapbox tile layer yourself. |
| `OPENAI_API_KEY` | No | Without it, `/ai/generate-itinerary` and `/ai/optimize-budget` use a deterministic rule-based generator, so AI features work out of the box. With it, itinerary generation calls OpenAI and validates the response before ever using it. |
| `JWT_SECRET` | Recommended | Set a long random string in production; the default is insecure. |
| `CORS_ORIGINS` | No | Comma-separated list of allowed frontend origins. |
| `VITE_API_URL` | No | Frontend's backend base URL; defaults to `http://localhost:8000`. |

## Installation & local development

**Prerequisites:** Node 20+, Python 3.11+.

### Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/pip install -r requirements.txt   # Windows
# source venv/bin/activate && pip install -r requirements.txt   # macOS/Linux

cp ../.env.example .env

# Seed destinations, activities, demo users, and sample trips:
./venv/Scripts/python.exe ../scripts/seed_demo_data.py

# Run the API (http://localhost:8000, docs at /docs):
./venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

Demo logins created by the seed script:
- `demo@globetrotter.app` / `Demo1234!` — regular user with two sample trips
- `admin@globetrotter.app` / `Admin1234!` — admin user, can access `/admin`

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev   # http://localhost:5173
```

### Running tests

```bash
cd backend
./venv/Scripts/python.exe -m pytest tests/ -v
```

### Dataset import (optional)

The app looks great immediately after `seed_demo_data.py` — **68 real destinations across 42
countries and territories** (every inhabited continent, plus 13 different Indian states), each
with an accurate description, currency, population, and realistic local daily-budget figure, and
**346 real, named activities** (actual landmarks, museums, tours, and restaurants — not filler
text). Seasonal "best time to visit" data is hand-curated for the most popular ~50 of them, with a
latitude-based fallback for the rest. To import a larger, legitimate dataset on top of this
instead:

```bash
# Cities from a GeoNames-style CSV export
./venv/Scripts/python.exe scripts/import_cities.py --file cities.csv

# Activities from an OpenTripMap-style CSV export
./venv/Scripts/python.exe scripts/import_activities.py --file activities.csv
```

Both scripts validate, normalize, and deduplicate rows, and accept `--columns` to map a
differently-named source schema onto the app's fields. No dataset is bundled with this repo —
download one yourself from a source whose license permits it.

## API overview

All endpoints are served from the backend root (default `http://localhost:8000`). Interactive
docs are auto-generated at `/docs`.

```
POST   /auth/register              POST   /auth/login
POST   /auth/forgot-password       POST   /auth/reset-password
GET    /auth/me

GET    /users/me                   PUT    /users/me                 PUT  /users/me/password
GET    /users/me/preferences       PUT    /users/me/preferences     GET  /users/me/stats
GET    /users/me/saved-destinations   POST/DELETE .../saved-destinations/{id}

GET    /destinations               GET    /destinations/search
GET    /destinations/recommended   GET    /destinations/seasonal
GET    /destinations/{id}          GET    /destinations/{id}/weather
GET    /destinations/{id}/trip-guide?total_days=&travelers=

GET    /activities                 GET    /activities/search        GET  /activities/{id}

GET    /trips                      POST   /trips
GET    /trips/{id}                 PUT    /trips/{id}                DELETE /trips/{id}
POST   /trips/{id}/duplicate

GET/POST   /trips/{id}/stops       PUT /trips/{id}/stops/reorder
PUT/DELETE /trips/{id}/stops/{stop_id}

GET/POST   /trips/{id}/activities              PUT /trips/{id}/activities/reorder
PUT/DELETE /trips/{id}/activities/{activity_id}
POST       /trips/{id}/activities/{activity_id}/duplicate

GET/POST   /trips/{id}/budget      PUT/DELETE /trips/{id}/budget/{record_id}
GET        /trips/{id}/calendar

POST/DELETE /trips/{id}/share      GET /shared/{share_id}      POST /shared/{share_id}/copy

POST   /ai/generate-itinerary
POST   /ai/generate-itinerary/{trip_id}/accept
POST   /ai/optimize-budget

GET    /admin/stats   (admin only)
```

Ownership is enforced on every trip-scoped route: private trips are only visible/editable by
their owner (or a collaborator with the `editor` role); public trips are readable by anyone via
`GET /trips/{id}` or the `/shared/{share_id}` route, but still only editable by the owner.

## Deployment

- **Frontend:** any static host that can build a Vite app (Vercel, Netlify, Cloudflare Pages).
  Set `VITE_API_URL` to your deployed backend's URL at build time.
- **Backend:** any host that can run a FastAPI app behind an ASGI server (Render, Railway, Fly.io,
  a plain VM with `uvicorn`/`gunicorn`). Set `DATABASE_URL` to a managed Postgres instance
  (Supabase or otherwise) and a strong `JWT_SECRET`.
- **Database:** Supabase Postgres works as-is — just point `DATABASE_URL` at it
  (`postgresql+psycopg2://...`) and run the backend once to create tables, then run
  `seed_demo_data.py` against that same `DATABASE_URL` if you want demo content.

## Troubleshooting

- **"We couldn't reach the server" in the UI** — the backend isn't running, or `VITE_API_URL`
  points somewhere else. Confirm `curl http://localhost:8000/health` returns `{"status":"healthy"}`.
- **Weather card shows "unavailable"** — Open-Meteo is unreachable from this network, or the
  request timed out; the UI degrades gracefully rather than erroring.
- **AI itinerary generation feels generic** — this is expected without `OPENAI_API_KEY`; the
  rule-based fallback produces a real, budget-aware plan but won't have the nuance an LLM would.
- **Backend changes not taking effect** — `uvicorn --reload`'s file watcher can occasionally miss
  a change; if a fix doesn't seem to apply, stop the process and start it again rather than
  relying on hot-reload.
- **Map tiles blank** — OpenStreetMap tile requests need outbound internet access; there's no API
  key to misconfigure, so this is almost always a network/firewall issue.

## Priorities / what's deliberately out of scope

Built in the order the spec prioritizes: auth → trip CRUD → destinations/activities → itinerary
builder → budget → responsive UI → map/calendar/sharing/weather/search → AI features →
recommendations → admin analytics. Not implemented: real-time collaboration on a shared trip,
push/email notification delivery (the `notifications` table and preference toggles exist, but no
delivery mechanism is wired up), and Alembic-managed migrations (schema is created via
`create_all()`, which is sufficient for a single-environment demo but not for versioned prod
migrations).
