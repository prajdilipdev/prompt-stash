-- ============================================================
-- Prompt Stash — 001 Initial schema
-- Tables: profiles, prompts, tags, prompt_tags
-- Plus updated_at automation and automatic profile creation.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles: public-safe user metadata, 1:1 with auth.users
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- prompts: the core library table. Soft-delete via archived_at
-- (hidden from active views, restorable) and deleted_at (trash,
-- restorable until permanent purge).
-- ------------------------------------------------------------
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
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

-- ------------------------------------------------------------
-- tags: owned per user; names unique per user (case-insensitive)
-- so duplicate tags can't be created accidentally.
-- ------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness per user (prevents accidental duplicates
-- like "Writing" vs "writing").
create unique index if not exists tags_user_lower_name_unique
  on public.tags (user_id, lower(name));

-- ------------------------------------------------------------
-- prompt_tags: many-to-many link with composite primary key
-- ------------------------------------------------------------
create table if not exists public.prompt_tags (
  prompt_id uuid not null references public.prompts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prompt_id, tag_id)
);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------

-- Keep updated_at fresh on any row update.
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

-- Create a profile row automatically when a new auth user signs up.
-- Security definer so it can write to profiles before RLS policies
-- would otherwise allow it during signup.
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
