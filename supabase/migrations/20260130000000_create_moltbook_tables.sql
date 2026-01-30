-- Moltbook Data Layer: activity tracking and daily snapshots

create table if not exists moltbook_activity (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  type text not null check (type in ('post', 'comment', 'reply', 'daily', 'agent')),
  title text,
  content text,
  moltbook_post_id text,
  moltbook_comment_id text,
  parent_url text,
  submolt text,
  target_agent text,
  url text,
  karma int default 0,
  comment_count int default 0,
  result text check (result in ('viral', 'engaged', 'moderate', 'flat')),
  influence text check (influence in ('local', 'submolt', 'cross-submolt', 'platform')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists moltbook_daily (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  date date not null,
  karma int,
  rank int,
  karma_delta int,
  followers int,
  posts_today int,
  comments_today int,
  top_post_url text,
  notes text,
  created_at timestamptz default now(),
  unique(agent_id, date)
);

create index if not exists idx_activity_agent on moltbook_activity(agent_id, created_at desc);
create index if not exists idx_activity_type on moltbook_activity(type);
create index if not exists idx_activity_result on moltbook_activity(result);
create index if not exists idx_daily_agent on moltbook_daily(agent_id, date desc);

alter table moltbook_activity enable row level security;
alter table moltbook_daily enable row level security;

create policy "Authenticated users can read moltbook_activity"
  on moltbook_activity for select
  to authenticated
  using (true);

create policy "Service role can insert moltbook_activity"
  on moltbook_activity for insert
  to service_role
  with check (true);

create policy "Service role can update moltbook_activity"
  on moltbook_activity for update
  to service_role
  using (true);

create policy "Authenticated users can read moltbook_daily"
  on moltbook_daily for select
  to authenticated
  using (true);

create policy "Service role can insert moltbook_daily"
  on moltbook_daily for insert
  to service_role
  with check (true);

create policy "Service role can update moltbook_daily"
  on moltbook_daily for update
  to service_role
  using (true);
