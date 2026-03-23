-- MailMate Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Users table (synced from Google OAuth)
create table if not exists users (
  id text primary key,
  email text not null,
  name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI analyses cached per user per thread
create table if not exists analyses (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade,
  thread_id text not null,
  gmail_thread_id text,
  analysis_data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, thread_id)
);

-- Thread metadata (starred, snoozed, labels, drafts)
create table if not exists thread_meta (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade,
  thread_id text not null,
  starred boolean default false,
  snoozed_until timestamptz,
  archived boolean default false,
  trashed boolean default false,
  draft text default '',
  user_labels text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, thread_id)
);

-- User-created labels
create table if not exists user_labels (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- Indexes for performance
create index if not exists idx_analyses_user on analyses(user_id);
create index if not exists idx_analyses_thread on analyses(user_id, thread_id);
create index if not exists idx_thread_meta_user on thread_meta(user_id);
create index if not exists idx_user_labels_user on user_labels(user_id);

-- Enable Row Level Security
alter table users enable row level security;
alter table analyses enable row level security;
alter table thread_meta enable row level security;
alter table user_labels enable row level security;

-- RLS Policies (service role bypasses these, anon key respects them)
create policy "Users can read own data" on users for select using (id = current_setting('request.jwt.claims', true)::json->>'sub');
create policy "Analyses: user access" on analyses for all using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
create policy "Thread meta: user access" on thread_meta for all using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
create policy "Labels: user access" on user_labels for all using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
