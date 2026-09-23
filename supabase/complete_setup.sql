-- ============================================================
-- Prompt Stash — Complete Database Setup for Supabase
--
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- Sets up:
-- 1. Tables (profiles, prompts, tags, prompt_tags)
-- 2. Triggers (updated_at automation, automatic profile on signup)
-- 3. Row Level Security (RLS) policies per user
-- 4. High-performance indexes & text search (pg_trgm)
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

-- profiles: public-safe user metadata, 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- prompts: core prompt library table
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  description text not null default '' check (char_length(description) <= 2000),
  content text not null check (char_length(content) between 1 and 100000),
  notes text not null default '' check (char_length(notes) <= 10000),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

-- tags: owned per user; names unique per user (case-insensitive)
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_user_lower_name_unique
  on public.tags (user_id, lower(name));

-- prompt_tags: many-to-many link with composite primary key
create table if not exists public.prompt_tags (
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

-- ------------------------------------------------------------
-- 2. AUTOMATION & TRIGGERS
-- ------------------------------------------------------------

-- Keep updated_at fresh on any row update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompts_set_updated_at on public.prompts;
create trigger prompts_set_updated_at
  before update on public.prompts
  for each row execute function public.set_updated_at();

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
  before update on public.tags
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.tags enable row level security;
alter table public.prompt_tags enable row level security;

-- profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- prompts policies
drop policy if exists "prompts_select_own" on public.prompts;
create policy "prompts_select_own" on public.prompts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "prompts_insert_own" on public.prompts;
create policy "prompts_insert_own" on public.prompts
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "prompts_update_own" on public.prompts;
create policy "prompts_update_own" on public.prompts
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prompts_delete_own" on public.prompts;
create policy "prompts_delete_own" on public.prompts
  for delete to authenticated
  using (auth.uid() = user_id);

-- tags policies
drop policy if exists "tags_select_own" on public.tags;
create policy "tags_select_own" on public.tags
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tags_insert_own" on public.tags;
create policy "tags_insert_own" on public.tags
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tags_update_own" on public.tags;
create policy "tags_update_own" on public.tags
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tags_delete_own" on public.tags;
create policy "tags_delete_own" on public.tags
  for delete to authenticated
  using (auth.uid() = user_id);

-- prompt_tags policies
drop policy if exists "prompt_tags_select_own" on public.prompt_tags;
create policy "prompt_tags_select_own" on public.prompt_tags
  for select to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_tags.prompt_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "prompt_tags_insert_own" on public.prompt_tags;
create policy "prompt_tags_insert_own" on public.prompt_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_tags.prompt_id and p.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = prompt_tags.tag_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "prompt_tags_delete_own" on public.prompt_tags;
create policy "prompt_tags_delete_own" on public.prompt_tags
  for delete to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_tags.prompt_id and p.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------

create index if not exists prompts_user_id_idx
  on public.prompts (user_id);

create index if not exists prompts_user_updated_idx
  on public.prompts (user_id, updated_at desc);

create index if not exists prompts_user_created_idx
  on public.prompts (user_id, created_at desc);

create index if not exists prompts_user_active_updated_idx
  on public.prompts (user_id, updated_at desc)
  where archived_at is null and deleted_at is null;

create index if not exists prompts_user_archived_idx
  on public.prompts (user_id, archived_at)
  where archived_at is not null;

create index if not exists prompts_user_deleted_idx
  on public.prompts (user_id, deleted_at)
  where deleted_at is not null;

create index if not exists prompts_user_favorite_idx
  on public.prompts (user_id, updated_at desc)
  where is_favorite = true;

create index if not exists prompts_title_trgm_idx
  on public.prompts using gin (title gin_trgm_ops);

create index if not exists prompts_content_trgm_idx
  on public.prompts using gin (content gin_trgm_ops);

create index if not exists tags_user_id_idx
  on public.tags (user_id);

create index if not exists prompt_tags_tag_id_idx
  on public.prompt_tags (tag_id);
