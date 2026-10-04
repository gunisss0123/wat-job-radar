# WAT Job Radar 2027 — Full Version

Personal near-real-time Work & Travel USA job aggregator for 3 friends.

## What is included
- Aggregators: OEG, IEE, ACADEX, New Step.
- iHappy is intentionally shown as `MANUAL` until a stable public job database/API is available. The app never pretends a source is live when it is not.
- Normalized job data: agency, employer, state/city, position, wage, housing, meals, hours, availability, dates and source URL.
- User-fit scoring tuned for this trip: employer/social 30%, nature 25%, estimated value 20%, second-job potential 15%, group-of-3 10%.
- Food/BOH + A2–B1 classification.
- Group Planner: finds 3-person combinations in the same city/area.
- Compare page.
- Change history: NEW_JOB, FULL→OPEN, slot, wage and housing changes.
- Source Health page: scraper failures are visible.
- GitHub Actions hourly scraper (recommended over doing a huge scrape inside Vercel functions).
- Optional Telegram refresh summary.
- Seed/demo data so the UI works before Supabase is connected.

## Why it is near real-time, not true real-time
Agencies do not expose one common push API. This system checks public pages periodically. Hourly is a sensible default. Do not hammer agency sites.

# Quick deploy — recommended

## 1) Extract and test locally
```bash
npm install
npm run dev
```
Open http://localhost:3000. Without Supabase, the UI uses demo data.

## 2) Create Supabase
1. Create a Supabase project.
2. SQL Editor → paste all of `supabase.sql` → Run.
3. Project Settings → API. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret)

## 3) Push to GitHub
```bash
git init
git add .
git commit -m "WAT Job Radar full version"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git push -u origin main
```

## 4) Add GitHub repository secrets
GitHub → Repo → Settings → Secrets and variables → Actions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `TELEGRAM_BOT_TOKEN`
- Optional: `TELEGRAM_CHAT_ID`

Then Actions → `Refresh WAT jobs` → Run workflow once.
After it succeeds, Supabase should have rows in `wat_jobs`, `wat_job_events`, `wat_source_runs`.

## 5) Deploy frontend on Vercel
Import the GitHub repo in Vercel.
Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

That is enough for normal viewing. The GitHub Action handles writes/scraping.

Optional, only if you also want Vercel `/api/refresh`:
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Do not expose the service role key in any `NEXT_PUBLIC_*` variable.

## 6) Automatic refresh
`.github/workflows/refresh.yml` runs hourly at minute 17.
You can change:
```yaml
- cron: '17 * * * *'
```
For example every 2 hours:
```yaml
- cron: '17 */2 * * *'
```

# Pages
- `/` — Job Radar
- `/group` — 3 Friends planner
- `/compare` — compare 2–4 jobs
- `/changes` — detected changes
- `/sources` — source/scraper health

# Important limitation
Scraping selectors can break when an agency redesigns its website. This is why Source Health is included. When one source shows ERROR, only that adapter needs fixing.

# How to add another agency
1. Create `lib/scrapers/<agency>.ts` returning normalized `Job[]`.
2. Add it to `lib/scrapers/index.ts`.
3. Run locally:
```bash
npm run scrape
```

# iHappy / manual-confirmed jobs
The public promotion image is not a live job database. Until a stable public jobs page/API is available, use manual entries or add an adapter once a reliable source exists. Do not infer live availability from a poster.

To import manually confirmed jobs:
```bash
cp data/manual-jobs.example.json data/manual-jobs.json
# edit the JSON, then
npm run import:manual -- data/manual-jobs.json
```
This is also useful when an Agency confirms 3 slots by LINE/phone but does not show them on the public website.

# Manual refresh via API (optional)
If `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` exist on Vercel:
```bash
curl -H "Authorization: Bearer YOUR_SECRET" "https://YOUR_APP.vercel.app/api/refresh?agency=OEG"
```
Supported agency values: `OEG`, `IEE`, `ACADEX`, `New Step`.

# Data policy
- If a source does not publish a slot count, the app stores `availableSlots = null` and shows `ไม่โชว์จำนวน`.
- It never turns unknown availability into OPEN.
- `FULL` can later become `OPEN`; the Changes page will capture that transition.
- Jobs missing from a successful scrape are not deleted immediately; after 3 consecutive misses they are marked stale and hidden from the main radar.
- Review/fit ratings are heuristic/curated and are separate from hard agency facts.

# Suggested next upgrades
- Employer review enrichment from a manually curated table (safer than scraping review sites).
- Email/Telegram alert only when a favorite region becomes OPEN with 3+ slots.
- Saved watchlist with Supabase Auth.
- Manual admin editor for iHappy/phone-confirmed availability.
