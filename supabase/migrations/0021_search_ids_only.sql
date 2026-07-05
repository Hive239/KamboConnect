-- 0021 Harden search: return only ids (Directory intersects ids; never expose
-- practitioner email/phone via the public RPC).
drop function if exists public.search_practitioners(text);
create or replace function public.search_practitioners(q text)
returns table(id text)
language sql stable as $$
  select p.id
  from public.practitioners p
  where q is null or btrim(q) = ''
     or to_tsvector('english', public.practitioner_search_text(p)) @@ websearch_to_tsquery('english', q)
     or public.practitioner_search_text(p) ilike '%'||q||'%'
     or similarity(coalesce(p.full_name,''), q) > 0.3
  order by
    ts_rank(to_tsvector('english', public.practitioner_search_text(p)), websearch_to_tsquery('english', coalesce(nullif(btrim(q),''),'x'))) desc,
    similarity(coalesce(p.full_name,''), coalesce(q,'')) desc;
$$;
grant execute on function public.search_practitioners(text) to anon, authenticated;
