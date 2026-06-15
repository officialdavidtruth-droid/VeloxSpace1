# VeloxSpace — Complete Build

Marketing command centre for social media managers and digital marketing agencies.

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Auth + DB**: Supabase (email/password auth, Postgres, RLS)
- **AI**: Cloudflare Workers AI (Llama 3.3 70B — free tier, 10k req/day)
- **Lead Scraper**: Google Places API
- **Hosting**: Netlify (auto-deploy on GitHub push)
- **Billing**: Paystack + Flutterwave (UI built, keys pending)

---

## Deploy in 4 steps

### Step 1 — Run the migration SQL
1. Open **Supabase → SQL Editor → + New query**
2. Paste the entire contents of `supabase/migration.sql`
3. Click **Run**

This creates all 15 tables, backfills existing users into workspaces,
and sets up Row Level Security. Safe to re-run.

---

### Step 2 — Set environment variables in Netlify
Go to **Netlify → Site → Environment variables** and add:

**Required (app won't work without these):**
```
VITE_SUPABASE_URL           your-project.supabase.co
VITE_SUPABASE_ANON_KEY      eyJ...
SUPABASE_URL                your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY   eyJ...
CLOUDFLARE_ACCOUNT_ID       abc123
CLOUDFLARE_API_TOKEN        abc123
VITE_SITE_URL               https://your-site.netlify.app
SITE_URL                    https://your-site.netlify.app
```

**Required for Meta (Instagram + Facebook + Meta Ads):**
```
VITE_META_APP_ID            your-facebook-app-id
META_APP_SECRET             your-facebook-app-secret
```

**Required for Google (YouTube + Google Ads):**
```
VITE_GOOGLE_CLIENT_ID       xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET        GOCSPX-xxx
GOOGLE_ADS_DEVELOPER_TOKEN  your-ads-developer-token
```

**Required for AI Lead Finder:**
```
GOOGLE_PLACES_API_KEY       AIzaSy...
```
Get it free at console.cloud.google.com → Enable "Places API" → Create API Key.
$200/month free credit = ~2,500 lead searches/month.

**Optional (connect when ready):**
```
VITE_TIKTOK_APP_ID          your-tiktok-app-id
TIKTOK_APP_SECRET           your-tiktok-secret
VITE_LINKEDIN_CLIENT_ID     your-linkedin-client-id
LINKEDIN_CLIENT_SECRET      your-linkedin-secret
VITE_TWITTER_CLIENT_ID      your-twitter-client-id
TWITTER_CLIENT_SECRET       your-twitter-secret
PAYSTACK_SECRET_KEY         sk_live_xxx    (add when billing goes live)
FLUTTERWAVE_SECRET_KEY      FLWSECK_xxx   (add when billing goes live)
```

---

### Step 3 — Push to GitHub
Open your repo in GitHub.dev (press `.` on the repo) and replace every
file with the contents from this zip. Commit → Netlify auto-deploys in ~60s.

**Files to create (new in this build):**
- `src/lib/plans.ts`
- `src/lib/workspace.tsx`
- `src/components/PlanGate.tsx`
- `src/components/PMS.tsx`
- `src/components/LeadScraper.tsx`
- `netlify/functions/scrape-leads.mts`

**Files to fully replace (everything else in src/ + netlify/):**
Replace all existing files with the versions from this zip.

---

### Step 4 — Add OAuth redirect URI
In every platform's developer portal, add this as the OAuth redirect/callback URL:
```
https://your-site.netlify.app/api/oauth-callback
```

---

## Feature map by plan

| Feature               | Starter (Free) | Pro ($29/mo) | Agency ($79/mo) |
|-----------------------|:--------------:|:------------:|:---------------:|
| Connected platforms   | 3              | Unlimited    | Unlimited       |
| Ads Analytics         | —              | ✓            | ✓               |
| AI insights / day     | 3              | Unlimited    | Unlimited       |
| Scheduled publishing  | —              | ✓            | ✓               |
| Approval workflow     | —              | ✓            | ✓               |
| PDF exports           | —              | ✓            | ✓               |
| Team seats            | Just you       | 5            | Unlimited       |
| Multiple workspaces   | —              | —            | 10              |
| Business Management   | —              | —            | ✓               |
| AI Lead Finder        | —              | —            | ✓               |

Paystack + Flutterwave billing UI is fully built. Add keys to activate.

---

## What's in the build

### Analytics
- Day-to-day growth tracking (followers, reach, impressions, engagement rate)
- Engagement breakdown per platform (likes/comments/shares + reach vs impressions)
- Unified Ads Analytics: Meta Ads + Google Ads + TikTok Ads
  - Campaign table (spend, CTR, CPC, CPM, ROAS per campaign)
  - Demographic breakdowns (age, gender)
  - Device breakdown (mobile/desktop/tablet)
  - Placement/network breakdown
  - Country spend breakdown
- AI analysis: what's working / what's not working + recommendations
- Organic insights per platform (LinkedIn, Instagram, Facebook, TikTok, YouTube, X)
- Marketing performance calculator (ROAS, ROI, CTR, CPA, CPM, CPC, CPL, CAC, LTV)

### Composer
- Publish to Facebook, LinkedIn, X simultaneously
- Post history with status per platform
- Media URL attachment

### Business Management (Agency plan)
- CRM: client profiles, contacts, retainer amounts, contract dates
- Client health indicators + renewal alerts (30-day warning)
- Project tracker (Planning → Active → Review → Completed) with budget utilisation
- Invoice manager (auto-numbered, sent/paid/overdue tracking, one-click mark paid)
- Monthly revenue chart from paid invoice history

### AI Lead Finder (Agency plan)
- Search Google Maps by business type + city/area
- "No website only" filter for hottest leads
- AI scores each lead 1–10 with reasoning + opportunity tags
- AI-generated personalized cold outreach pitch per lead
- Status pipeline: New → Contacted → Qualified → Converted → Rejected
- One-click "Add to CRM" converts a lead into a Business Management client
- CSV export of full lead list

### Infrastructure
- Multi-workspace: agencies can manage multiple client brands from one login
- Team members: invite by email, roles (owner/admin/member/viewer)
- Plan gating: locked features show clear upgrade prompts
- Workspace switcher in sidebar
- Real-time workspace auto-provisioning on first login
