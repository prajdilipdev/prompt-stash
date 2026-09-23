-- ============================================================
-- Prompt Stash — 002 Row Level Security
--
-- Every table is isolated per user. User A can never read,
-- modify, or delete User B's data — enforced in the database,
-- not the frontend. Only the publishable key is shipped to
-- clients; the service-role key is never used by this app.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.tags enable row level security;
alter table public.prompt_tags enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- prompts
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- tags
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- prompt_tags
-- Ownership is derived from the parent prompt AND the tag,
-- so a user can never link another user's prompt or tag.
-- ------------------------------------------------------------
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

-- No UPDATE policy on prompt_tags: links are replaced, never mutated.

drop policy if exists "prompt_tags_delete_own" on public.prompt_tags;
create policy "prompt_tags_delete_own" on public.prompt_tags
  for delete to authenticated
  using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_tags.prompt_id and p.user_id = auth.uid()
    )
  );
