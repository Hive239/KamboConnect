-- 0019 Keyless full-text + fuzzy search over practitioners (Postgres, no external service).
create extension if not exists pg_trgm;

-- Immutable helper so we can index the exact search expression.
create or replace function public.practitioner_search_text(p public.practitioners)
returns text language sql immutable as $$
  select coalesce(p.full_name,'')||' '||coalesce(p.bio,'')||' '||
         coalesce(p.specializations::text,'')||' '||coalesce(p.modalities::text,'')||' '||
         coalesce(p.languages::text,'');
$$;

create index if not exists idx_practitioners_fts
  on public.practitioners using gin (to_tsvector('english', public.practitioner_search_text(practitioners)));
create index if not exists idx_practitioners_name_trgm
  on public.practitioners using gin (full_name gin_trgm_ops);

-- Ranked search: full-text match OR fuzzy (typo-tolerant) name match.
create or replace function public.search_practitioners(q text)
returns setof public.practitioners
language sql stable as $$
  select p.*
  from public.practitioners p
  where q is null or btrim(q) = ''
     or to_tsvector('english', public.practitioner_search_text(p)) @@ websearch_to_tsquery('english', q)
     or public.practitioner_search_text(p) ilike '%'||q||'%'
     or similarity(coalesce(p.full_name,''), q) > 0.3
  order by
    ts_rank(to_tsvector('english', public.practitioner_search_text(p)), websearch_to_tsquery('english', coalesce(nullif(btrim(q),''),'x'))) desc,
    similarity(coalesce(p.full_name,''), coalesce(q,'')) desc,
    p.full_name asc;
$$;

grant execute on function public.search_practitioners(text) to anon, authenticated;
