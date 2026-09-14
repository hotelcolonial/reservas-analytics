-- ─────────────────────────────────────────────────────────────────────────
-- 005 — Acesso só para usuário autenticado e ativo
-- Rode UMA vez no SQL Editor, depois de 004 (usuario_ativo() lê perfis).
--
-- Substitui as policies permissivas de 001–003 pela regra única
-- "acesso autenticado": qualquer operação nas 8 tabelas (e no bucket
-- comprovantes) exige sessão E perfil ativo. O role anon perde todo acesso.
--
-- Origem: extraído do banco real com supabase/extrair-estado.sql em
-- 2026-09-14. As sentenças CREATE/ALTER vêm transcritas como estão no banco.
-- Os DROP POLICY e os REVOKE não vêm do catálogo (um drop não deixa rastro):
-- os DROP derivam dos nomes que 001–003 criam, e os REVOKE do bloco `grants`,
-- que mostra que anon não tem nenhum privilégio nessas tabelas.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Função de guarda ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.usuario_ativo()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select exists (
 select 1 from public.perfis
 where id = auth.uid() and ativo = true
 );
$function$
;

-- ── Policies antigas (criadas por 001, 002 e 003) ────────────────────────
-- Não existem mais no banco: pg_policies só lista as "acesso autenticado".

drop policy if exists "Authenticated users can read campanhas"  on public.campanhas;
drop policy if exists "Authenticated users can write campanhas" on public.campanhas;
drop policy if exists "Authenticated users can read reservas"   on public.reservas;
drop policy if exists "Authenticated users can write reservas"  on public.reservas;
drop policy if exists "Authenticated users can read gastos"     on public.gastos;
drop policy if exists "Authenticated users can write gastos"    on public.gastos;

drop policy if exists "propriedades read"  on public.propriedades;
drop policy if exists "propriedades write" on public.propriedades;

drop policy if exists "cartoes read"               on public.cartoes;
drop policy if exists "cartoes write"              on public.cartoes;
drop policy if exists "naturezas read"             on public.naturezas;
drop policy if exists "naturezas write"            on public.naturezas;
drop policy if exists "despesas_recorrentes read"  on public.despesas_recorrentes;
drop policy if exists "despesas_recorrentes write" on public.despesas_recorrentes;
drop policy if exists "lancamentos read"           on public.lancamentos;
drop policy if exists "lancamentos write"          on public.lancamentos;

-- ── RLS ligado nas 8 tabelas (001–003 já ligam; aqui como está no banco) ──

alter table public.campanhas enable row level security;
alter table public.cartoes enable row level security;
alter table public.despesas_recorrentes enable row level security;
alter table public.gastos enable row level security;
alter table public.lancamentos enable row level security;
alter table public.naturezas enable row level security;
alter table public.propriedades enable row level security;
alter table public.reservas enable row level security;

-- ── Policy única por tabela ──────────────────────────────────────────────

create policy "acesso autenticado" on public.campanhas as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.cartoes as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.despesas_recorrentes as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.gastos as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.lancamentos as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.naturezas as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.propriedades as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());
create policy "acesso autenticado" on public.reservas as permissive for all to authenticated using (usuario_ativo()) with check (usuario_ativo());

-- ── Storage: bucket comprovantes (PRIVADO; criar à mão, ver README) ──────

create policy "comprovantes: acesso autenticado" on storage.objects as permissive for all to authenticated using (((bucket_id = 'comprovantes'::text) AND usuario_ativo())) with check (((bucket_id = 'comprovantes'::text) AND usuario_ativo()));

-- ── anon sem acesso ──────────────────────────────────────────────────────
-- Estado no banco (bloco `grants`): só `authenticated` tem privilégios.

revoke all privileges on table public.propriedades         from anon;
revoke all privileges on table public.campanhas            from anon;
revoke all privileges on table public.reservas             from anon;
revoke all privileges on table public.gastos               from anon;
revoke all privileges on table public.cartoes              from anon;
revoke all privileges on table public.naturezas            from anon;
revoke all privileges on table public.despesas_recorrentes from anon;
revoke all privileges on table public.lancamentos          from anon;
revoke all privileges on table public.perfis               from anon;
