-- ============================================================
-- Prompt Stash — 003 Indexes
-- Sized for libraries with thousands of prompts. All hot paths
-- (library listing, sorting, filtering) are index-backed.
-- ============================================================

-- prompts: owner-scoped hot paths
create index if not exists prompts_user_id_idx
  on public.prompts (user_id);

create index if not exists prompts_user_updated_idx
  on public.prompts (user_id, updated_at desc);

create index if not exists prompts_user_created_idx
  on public.prompts (user_id, created_at desc);

-- Partial indexes: only active rows (the common case)
create index if not exists prompts_user_active_updated_idx
  on public.prompts (user_id, updated_at desc)
  where archived_at is null and deleted_at is null;

create index if not exists prompts_user_archived_idx
  on public.prompts (user_id, archived_at)
  where archived_at is not null;

create index if not exists prompts_user_deleted_idx
  on public.prompts (user_id, deleted_at)
  where deleted_at is not null;

-- Favorites
create index if not exists prompts_user_favorite_idx
  on public.prompts (user_id, updated_at desc)
  where is_favorite = true;

-- Text search support (ILIKE queries used by app search)
create extension if not exists pg_trgm;

create index if not exists prompts_title_trgm_idx
  on public.prompts using gin (title gin_trgm_ops);

create index if not exists prompts_content_trgm_idx
  on public.prompts using gin (content gin_trgm_ops);

-- tags: owner + case-insensitive name lookups
create index if not exists tags_user_id_idx
  on public.tags (user_id);

-- prompt_tags: reverse lookup (tag -> prompts); forward is the PK
create index if not exists prompt_tags_tag_id_idx
  on public.prompt_tags (tag_id);
