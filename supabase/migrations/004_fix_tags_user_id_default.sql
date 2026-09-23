-- ============================================================
-- Prompt Stash — 004 Fix default user_id for tags & prompts
-- Ensures rows inserted without explicit user_id default to
-- the authenticated user's ID (auth.uid()), preventing RLS
-- check violations on insert.
-- ============================================================

alter table if exists public.tags
  alter column user_id set default auth.uid();

alter table if exists public.prompts
  alter column user_id set default auth.uid();
