-- Extrai o estado real do banco (Supabase SQL Editor). Só lê catálogos.
-- Resultado: ordem, bloco, sql. Exportar como CSV e colar de volta.
with
perfis_cols as (
  select 1 as ordem, 'perfis' as bloco,
    'create table if not exists public.perfis (' || chr(10) ||
    string_agg(
      format('  %I %s%s%s',
        a.attname,
        format_type(a.atttypid, a.atttypmod),
        case when a.attnotnull then ' not null' else '' end,
        case when d.adbin is not null
             then ' default ' || pg_get_expr(d.adbin, d.adrelid) else '' end),
      ',' || chr(10) order by a.attnum)
    || chr(10) || ');' as sql
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.perfis'::regclass
    and a.attnum > 0 and not a.attisdropped
),
perfis_cons as (
  select 2, 'perfis',
    format('alter table public.perfis add constraint %I %s;',
           conname, pg_get_constraintdef(oid))
  from pg_constraint
  where conrelid = 'public.perfis'::regclass
),
auditoria as (
  select 3, 'auditoria',
    format('alter table public.%I add column if not exists %I %s%s%s;',
      c.relname, a.attname, format_type(a.atttypid, a.atttypmod),
      case when a.attnotnull then ' not null' else '' end,
      case when d.adbin is not null
           then ' default ' || pg_get_expr(d.adbin, d.adrelid) else '' end)
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
    and a.attname in ('criado_por', 'criado_em', 'atualizado_em')
    and not a.attisdropped
),
auditoria_fk as (
  select 4, 'auditoria',
    format('alter table public.%I add constraint %I %s;',
           c.relname, k.conname, pg_get_constraintdef(k.oid))
  from pg_constraint k
  join pg_class c on c.oid = k.conrelid
  where c.relnamespace = 'public'::regnamespace and k.contype = 'f'
    and exists (
      select 1 from pg_attribute a
      where a.attrelid = k.conrelid and a.attnum = any (k.conkey)
        and a.attname = 'criado_por')
),
funcoes as (
  select 5, 'funcoes', pg_get_functiondef(p.oid) || ';'
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
),
gatilhos as (
  select 6, 'gatilhos', pg_get_triggerdef(t.oid) || ';'
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal
    and (c.relnamespace = 'public'::regnamespace
         or (c.relnamespace = 'auth'::regnamespace and c.relname = 'users'))
),
rls as (
  select 7, 'rls',
    format('alter table %I.%I %s row level security;%s',
      n.nspname, c.relname,
      case when c.relrowsecurity then 'enable' else 'disable' end,
      case when c.relforcerowsecurity then ' -- FORCE' else '' end)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
politicas as (
  select 8, 'politicas',
    format('create policy %I on %I.%I as %s for %s to %s%s%s;',
      policyname, schemaname, tablename,
      lower(permissive), lower(cmd), array_to_string(roles, ', '),
      case when qual is not null then ' using (' || qual || ')' else '' end,
      case when with_check is not null
           then ' with check (' || with_check || ')' else '' end)
  from pg_policies
  where schemaname in ('public', 'storage')
),
grants as (
  select 9, 'grants',
    format('-- grant atual: %s on %I.%I to %s',
      string_agg(privilege_type, ', ' order by privilege_type),
      table_schema, table_name, grantee)
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee in ('anon', 'authenticated')
  group by table_schema, table_name, grantee
),
buckets as (
  select 10, 'buckets', format('-- bucket %s: public=%s', id, public)
  from storage.buckets
),
indices as (
  select 11, 'indices', indexdef || ';'
  from pg_indexes
  where schemaname = 'public'
)
select ordem, bloco, sql from (
  select * from perfis_cols
  union all select * from perfis_cons
  union all select * from auditoria
  union all select * from auditoria_fk
  union all select * from funcoes
  union all select * from gatilhos
  union all select * from rls
  union all select * from politicas
  union all select * from grants
  union all select * from buckets
  union all select * from indices
) x
order by ordem, sql;
