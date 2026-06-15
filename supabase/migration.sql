-- ═══════════════════════════════════════════════════════════════════════════════
-- VELOXSPACE — COMPLETE MIGRATION
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- Safe to re-run (all statements use IF NOT EXISTS / IF EXISTS guards)
-- Covers everything from v3 → v7 + PMS add-on
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Core social / analytics tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.platform_connections (
  id                  text primary key,
  uid                 text not null,
  workspace_id        uuid,
  platform            text not null,
  account_id          text default '',
  account_name        text default '',
  profile_picture_url text default '',
  access_token        text default '',
  connected           boolean default false,
  last_synced_at      timestamptz
);

create table if not exists public.social_metrics (
  id                  text primary key,
  uid                 text not null,
  workspace_id        uuid,
  platform            text not null,
  followers           bigint  default 0,
  following           bigint  default 0,
  posts               integer default 0,
  likes               bigint  default 0,
  comments            bigint  default 0,
  shares              bigint  default 0,
  reach               bigint  default 0,
  impressions         bigint  default 0,
  engagement_rate     numeric default 0,
  profile_views       integer default 0,
  profile_picture_url text    default '',
  synced_at           timestamptz default now()
);

create table if not exists public.platform_posts (
  id               text primary key,
  uid              text not null,
  workspace_id     uuid,
  platform         text not null,
  post_id          text default '',
  caption          text default '',
  media_url        text default '',
  thumbnail_url    text default '',
  post_url         text default '',
  likes            bigint  default 0,
  comments         bigint  default 0,
  shares           bigint  default 0,
  reach            bigint  default 0,
  impressions      bigint  default 0,
  views            bigint  default 0,
  engagement_rate  numeric default 0,
  posted_at        timestamptz,
  synced_at        timestamptz default now()
);

create table if not exists public.ai_insights (
  id              text primary key,
  uid             text not null,
  workspace_id    uuid,
  platform        text not null,
  overall_score   numeric default 0,
  top_platform    text    default '',
  key_insight     text    default '',
  working         jsonb   default '[]',
  not_working     jsonb   default '[]',
  recommendations jsonb   default '[]',
  best_times      jsonb   default '{}',
  content_insight text    default '',
  generated_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Analytics enhancement tables (v3–v6)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.scheduled_posts (
  id           uuid default gen_random_uuid() primary key,
  uid          text not null,
  workspace_id uuid,
  content      text not null default '',
  media_url    text default '',
  platforms    text[] not null default '{}',
  status       text not null default 'draft',
  results      jsonb default '{}',
  scheduled_for timestamptz,
  created_at   timestamptz default now(),
  published_at timestamptz
);

create table if not exists public.ad_metrics (
  id           uuid default gen_random_uuid() primary key,
  uid          text not null,
  workspace_id uuid,
  platform     text default 'all',
  period_label text default 'Manual',
  ad_spend     numeric default 0,
  revenue      numeric default 0,
  clicks       integer default 0,
  impressions  integer default 0,
  conversions  integer default 0,
  leads        integer default 0,
  currency     text default 'USD',
  recorded_at  timestamptz default now()
);

create table if not exists public.ad_breakdowns (
  id              uuid default gen_random_uuid() primary key,
  uid             text not null,
  workspace_id    uuid,
  platform        text not null,
  dimension       text not null,
  dimension_value text not null,
  spend           numeric default 0,
  impressions     bigint  default 0,
  clicks          bigint  default 0,
  conversions     numeric default 0,
  ctr             numeric default 0,
  cpc             numeric default 0,
  recorded_at     timestamptz default now()
);

create table if not exists public.ad_campaigns (
  id            uuid default gen_random_uuid() primary key,
  uid           text not null,
  workspace_id  uuid,
  platform      text not null,
  campaign_name text not null,
  status        text default '',
  spend         numeric default 0,
  impressions   bigint  default 0,
  clicks        bigint  default 0,
  conversions   numeric default 0,
  ctr           numeric default 0,
  cpc           numeric default 0,
  cpm           numeric default 0,
  roas          numeric default 0,
  recorded_at   timestamptz default now()
);

create table if not exists public.metric_history (
  id              text primary key,
  uid             text not null,
  workspace_id    uuid,
  platform        text not null,
  date            date not null,
  followers       bigint  default 0,
  following       bigint  default 0,
  posts           integer default 0,
  likes           bigint  default 0,
  comments        bigint  default 0,
  shares          bigint  default 0,
  reach           bigint  default 0,
  impressions     bigint  default 0,
  engagement_rate numeric default 0,
  profile_views   integer default 0,
  recorded_at     timestamptz default now()
);

-- Backfill columns that may be missing on pre-existing installs
alter table public.platform_connections add column if not exists workspace_id        uuid;
alter table public.platform_connections add column if not exists profile_picture_url text default '';
alter table public.social_metrics       add column if not exists workspace_id        uuid;
alter table public.social_metrics       add column if not exists profile_picture_url text default '';
alter table public.platform_posts       add column if not exists workspace_id        uuid;
alter table public.ai_insights          add column if not exists workspace_id        uuid;
alter table public.ad_metrics           add column if not exists workspace_id        uuid;
alter table public.ad_breakdowns        add column if not exists workspace_id        uuid;
alter table public.ad_campaigns         add column if not exists workspace_id        uuid;
alter table public.metric_history       add column if not exists workspace_id        uuid;
alter table public.scheduled_posts      add column if not exists workspace_id        uuid;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Workspace & team tables (v7)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.workspaces (
  id                      uuid default gen_random_uuid() primary key,
  name                    text not null default 'My Workspace',
  type                    text not null default 'individual',
  plan                    text not null default 'starter',
  owner_uid               text not null,
  billing_email           text default '',
  paystack_customer_id    text default '',
  flutterwave_customer_id text default '',
  plan_started_at         timestamptz default now(),
  plan_expires_at         timestamptz,
  created_at              timestamptz default now()
);

create table if not exists public.workspace_members (
  id            uuid default gen_random_uuid() primary key,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  uid           text not null default '',
  role          text not null default 'member',
  status        text not null default 'active',
  invited_email text default '',
  invited_at    timestamptz default now(),
  joined_at     timestamptz,
  unique(workspace_id, uid)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: PMS & Lead Scraper tables (Agency add-on)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.pms_clients (
  id               uuid default gen_random_uuid() primary key,
  workspace_id     uuid not null,
  uid              text not null default '',
  business_name    text not null,
  contact_name     text default '',
  email            text default '',
  phone            text default '',
  website          text default '',
  industry         text default '',
  status           text default 'active',
  monthly_retainer numeric default 0,
  currency         text default 'USD',
  contract_start   date,
  contract_end     date,
  notes            text default '',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists public.pms_projects (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid not null,
  uid          text not null default '',
  client_id    uuid references public.pms_clients(id) on delete cascade,
  name         text not null,
  status       text default 'planning',
  type         text default '',
  budget       numeric default 0,
  spent        numeric default 0,
  currency     text default 'USD',
  start_date   date,
  end_date     date,
  notes        text default '',
  created_at   timestamptz default now()
);

create table if not exists public.pms_invoices (
  id             uuid default gen_random_uuid() primary key,
  workspace_id   uuid not null,
  uid            text not null default '',
  client_id      uuid references public.pms_clients(id) on delete cascade,
  invoice_number text default '',
  amount         numeric default 0,
  currency       text default 'USD',
  status         text default 'draft',
  due_date       date,
  paid_at        timestamptz,
  description    text default '',
  created_at     timestamptz default now()
);

create table if not exists public.leads (
  id                  uuid default gen_random_uuid() primary key,
  workspace_id        uuid not null,
  uid                 text not null default '',
  business_name       text not null,
  contact_name        text default '',
  email               text default '',
  phone               text default '',
  website             text default '',
  address             text default '',
  category            text default '',
  location            text default '',
  rating              numeric default 0,
  review_count        integer default 0,
  source              text default 'manual',
  place_id            text default '',
  has_website         boolean default true,
  status              text default 'new',
  ai_score            integer default 0,
  ai_tier             text default '',
  ai_opportunities    text[] default '{}',
  ai_reasoning        text default '',
  ai_pitch            text default '',
  notes               text default '',
  converted_client_id uuid,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: Backfill existing users → auto-create individual workspaces
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  r     record;
  ws_id uuid;
begin
  for r in select id::text as uid, email from auth.users loop
    -- Only create a workspace if none exists for this user
    select id into ws_id from public.workspaces where owner_uid = r.uid limit 1;

    if ws_id is null then
      insert into public.workspaces (name, type, plan, owner_uid)
        values (coalesce(split_part(r.email,'@',1), 'My Workspace') || '''s Workspace', 'individual', 'starter', r.uid)
        returning id into ws_id;

      insert into public.workspace_members (workspace_id, uid, invited_email, role, status, joined_at)
        values (ws_id, r.uid, coalesce(r.email,''), 'owner', 'active', now())
        on conflict (workspace_id, uid) do nothing;
    end if;

    -- Stamp all existing data rows with this workspace_id
    update public.platform_connections set workspace_id = ws_id, id = ws_id::text || '_' || platform
      where uid = r.uid and workspace_id is null;
    update public.social_metrics       set workspace_id = ws_id, id = ws_id::text || '_' || platform
      where uid = r.uid and workspace_id is null;
    update public.platform_posts       set workspace_id = ws_id
      where uid = r.uid and workspace_id is null;
    update public.ai_insights          set workspace_id = ws_id, id = ws_id::text || '_' || platform
      where uid = r.uid and workspace_id is null;
    update public.ad_metrics           set workspace_id = ws_id where uid = r.uid and workspace_id is null;
    update public.ad_breakdowns        set workspace_id = ws_id where uid = r.uid and workspace_id is null;
    update public.ad_campaigns         set workspace_id = ws_id where uid = r.uid and workspace_id is null;
    update public.metric_history       set workspace_id = ws_id
      where uid = r.uid and workspace_id is null;
    update public.scheduled_posts      set workspace_id = ws_id where uid = r.uid and workspace_id is null;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.platform_connections  enable row level security;
alter table public.social_metrics        enable row level security;
alter table public.platform_posts        enable row level security;
alter table public.ai_insights           enable row level security;
alter table public.ad_metrics            enable row level security;
alter table public.ad_breakdowns         enable row level security;
alter table public.ad_campaigns          enable row level security;
alter table public.metric_history        enable row level security;
alter table public.scheduled_posts       enable row level security;
alter table public.workspaces            enable row level security;
alter table public.workspace_members     enable row level security;
alter table public.pms_clients           enable row level security;
alter table public.pms_projects          enable row level security;
alter table public.pms_invoices          enable row level security;
alter table public.leads                 enable row level security;

-- Workspace RLS (no self-reference — checks workspaces.owner_uid or workspace_members.uid directly)
drop policy if exists "workspaces: insert"  on public.workspaces;
drop policy if exists "workspaces: select"  on public.workspaces;
drop policy if exists "workspaces: update"  on public.workspaces;
drop policy if exists "workspaces: members can view"  on public.workspaces;
drop policy if exists "workspaces: owner can update"  on public.workspaces;
drop policy if exists "workspaces: anyone can create" on public.workspaces;
create policy "workspaces: insert" on public.workspaces for insert with check (owner_uid = auth.uid()::text);
create policy "workspaces: select" on public.workspaces for select using (
  owner_uid = auth.uid()::text
  or id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);
create policy "workspaces: update" on public.workspaces for update using (owner_uid = auth.uid()::text);

-- workspace_members RLS (select by own uid avoids recursive policy)
drop policy if exists "workspace_members: select"         on public.workspace_members;
drop policy if exists "workspace_members: insert own"     on public.workspace_members;
drop policy if exists "workspace_members: insert invite"  on public.workspace_members;
drop policy if exists "workspace_members: delete"         on public.workspace_members;
drop policy if exists "workspace_members: members can view"   on public.workspace_members;
drop policy if exists "workspace_members: owner/admin manage" on public.workspace_members;
create policy "workspace_members: select" on public.workspace_members for select using (
  uid = auth.uid()::text
  or workspace_id in (select id from public.workspaces where owner_uid = auth.uid()::text)
);
create policy "workspace_members: insert own"    on public.workspace_members for insert with check (uid = auth.uid()::text);
create policy "workspace_members: insert invite" on public.workspace_members for insert with check (
  workspace_id in (select id from public.workspaces where owner_uid = auth.uid()::text)
);
create policy "workspace_members: delete" on public.workspace_members for delete using (
  uid = auth.uid()::text
  or workspace_id in (select id from public.workspaces where owner_uid = auth.uid()::text)
);

-- Workspace-scoped data table RLS (single reusable pattern)
drop policy if exists "platform_connections: own"       on public.platform_connections;
drop policy if exists "platform_connections: workspace"  on public.platform_connections;
create policy "platform_connections: workspace" on public.platform_connections for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "social_metrics: own"       on public.social_metrics;
drop policy if exists "social_metrics: workspace"  on public.social_metrics;
create policy "social_metrics: workspace" on public.social_metrics for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "platform_posts: own"       on public.platform_posts;
drop policy if exists "platform_posts: workspace"  on public.platform_posts;
create policy "platform_posts: workspace" on public.platform_posts for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "ai_insights: own"       on public.ai_insights;
drop policy if exists "ai_insights: workspace"  on public.ai_insights;
create policy "ai_insights: workspace" on public.ai_insights for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "ad_metrics: own"       on public.ad_metrics;
drop policy if exists "ad_metrics: workspace"  on public.ad_metrics;
create policy "ad_metrics: workspace" on public.ad_metrics for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "ad_breakdowns: own"       on public.ad_breakdowns;
drop policy if exists "ad_breakdowns: workspace"  on public.ad_breakdowns;
create policy "ad_breakdowns: workspace" on public.ad_breakdowns for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "ad_campaigns: own"       on public.ad_campaigns;
drop policy if exists "ad_campaigns: workspace"  on public.ad_campaigns;
create policy "ad_campaigns: workspace" on public.ad_campaigns for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "metric_history: own"       on public.metric_history;
drop policy if exists "metric_history: workspace"  on public.metric_history;
create policy "metric_history: workspace" on public.metric_history for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "scheduled_posts: own"       on public.scheduled_posts;
drop policy if exists "scheduled_posts: workspace"  on public.scheduled_posts;
create policy "scheduled_posts: workspace" on public.scheduled_posts for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "pms_clients: workspace"  on public.pms_clients;
create policy "pms_clients: workspace" on public.pms_clients for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "pms_projects: workspace"  on public.pms_projects;
create policy "pms_projects: workspace" on public.pms_projects for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "pms_invoices: workspace"  on public.pms_invoices;
create policy "pms_invoices: workspace" on public.pms_invoices for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

drop policy if exists "leads: workspace"  on public.leads;
create policy "leads: workspace" on public.leads for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7: Performance indexes
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists platform_connections_uid_idx  on public.platform_connections (uid);
create index if not exists platform_connections_ws_idx   on public.platform_connections (workspace_id);
create index if not exists social_metrics_uid_idx        on public.social_metrics (uid);
create index if not exists social_metrics_ws_idx         on public.social_metrics (workspace_id);
create index if not exists platform_posts_uid_idx        on public.platform_posts (uid);
create index if not exists platform_posts_ws_idx         on public.platform_posts (workspace_id);
create index if not exists ai_insights_uid_idx           on public.ai_insights (uid);
create index if not exists ai_insights_ws_idx            on public.ai_insights (workspace_id);
create index if not exists ad_metrics_uid_idx            on public.ad_metrics (uid);
create index if not exists ad_metrics_ws_idx             on public.ad_metrics (workspace_id);
create index if not exists ad_breakdowns_uid_idx         on public.ad_breakdowns (uid);
create index if not exists ad_breakdowns_ws_idx          on public.ad_breakdowns (workspace_id);
create index if not exists ad_campaigns_uid_idx          on public.ad_campaigns (uid);
create index if not exists ad_campaigns_ws_idx           on public.ad_campaigns (workspace_id);
create index if not exists metric_history_uid_idx        on public.metric_history (uid, platform, date);
create index if not exists metric_history_ws_idx         on public.metric_history (workspace_id);
create index if not exists scheduled_posts_uid_idx       on public.scheduled_posts (uid);
create index if not exists scheduled_posts_ws_idx        on public.scheduled_posts (workspace_id);
create index if not exists workspace_members_uid_idx     on public.workspace_members (uid);
create index if not exists workspace_members_ws_idx      on public.workspace_members (workspace_id);
create index if not exists pms_clients_ws_idx            on public.pms_clients (workspace_id);
create index if not exists pms_projects_ws_idx           on public.pms_projects (workspace_id);
create index if not exists pms_projects_client_idx       on public.pms_projects (client_id);
create index if not exists pms_invoices_ws_idx           on public.pms_invoices (workspace_id);
create index if not exists pms_invoices_client_idx       on public.pms_invoices (client_id);
create index if not exists leads_ws_idx                  on public.leads (workspace_id);
create index if not exists leads_place_id_idx            on public.leads (place_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE. Your VeloxSpace database is ready.
-- All existing data has been migrated to workspace-scoped access.
-- New users get a workspace auto-provisioned on first login.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- v8: Content Calendar · Notifications · Client Portal · Referrals · Credits
-- ═══════════════════════════════════════════════════════════════════════════════

-- Extend workspaces with referral + portal + credit fields
alter table public.workspaces add column if not exists referral_code       text default '';
alter table public.workspaces add column if not exists referred_by_code    text default '';
alter table public.workspaces add column if not exists referral_days_earned integer default 0;
alter table public.workspaces add column if not exists portal_token        text default '';
alter table public.workspaces add column if not exists portal_enabled      boolean default false;
alter table public.workspaces add column if not exists lead_credits        integer default 10;
alter table public.workspaces add column if not exists lead_credits_reset  date;

-- Extend scheduled_posts with calendar fields
alter table public.scheduled_posts add column if not exists cta_text       text default '';
alter table public.scheduled_posts add column if not exists calendar_note  text default '';
alter table public.scheduled_posts add column if not exists post_type      text default 'post';

-- In-app notifications
create table if not exists public.notifications (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid not null,
  uid          text not null default '',
  type         text default 'info',   -- info | success | warning | milestone | referral
  title        text not null,
  message      text default '',
  read         boolean default false,
  created_at   timestamptz default now()
);
create index if not exists notifications_ws_idx   on public.notifications (workspace_id);
create index if not exists notifications_read_idx on public.notifications (workspace_id, read);
alter table public.notifications enable row level security;
drop policy if exists "notifications: workspace" on public.notifications;
create policy "notifications: workspace" on public.notifications for all using (
  workspace_id in (select workspace_id from public.workspace_members where uid = auth.uid()::text and status = 'active')
);

-- Backfill referral codes for existing workspaces
update public.workspaces
set referral_code = upper(substring(md5(id::text) from 1 for 8))
where referral_code = '' or referral_code is null;

-- Backfill lead credits based on plan
update public.workspaces set lead_credits = 10  where plan = 'starter' and lead_credits = 10;
update public.workspaces set lead_credits = 50  where plan = 'pro';
update public.workspaces set lead_credits = 200 where plan = 'agency';

-- Helper function to decrement lead credits atomically
create or replace function public.decrement_lead_credits(ws_id uuid, amount integer)
returns void language sql as $$
  update public.workspaces
  set lead_credits = greatest(0, lead_credits - amount)
  where id = ws_id;
$$;
