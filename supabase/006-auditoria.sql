-- ─────────────────────────────────────────────────────────────────────────
-- 006 — Auditoria: quem criou, quando, e quando mexeu por último
-- Rode UMA vez no SQL Editor, depois de 004 (as FKs apontam para perfis).
--
-- Nas 8 tabelas: criado_por (→ perfis), criado_em e atualizado_em,
-- preenchidos por trigger. O app NUNCA manda essas colunas: ao_inserir
-- carimba autor e datas com auth.uid()/now(); ao_atualizar força criado_por
-- e criado_em aos valores anteriores e renova atualizado_em.
--
-- Origem: extraído do banco real com supabase/extrair-estado.sql em
-- 2026-09-14. SQL transcrito como veio, sem reescrita — exceto o bloco
-- marcado de lancamentos.criado_em (ver abaixo).
-- ─────────────────────────────────────────────────────────────────────────

-- ── lancamentos.criado_em: de text para timestamptz ──────────────────────
-- 003 cria a coluna como `text not null` (data yyyy-mm-dd escrita pelo app).
-- No banco ela é hoje `timestamp with time zone not null default now()`, e o
-- `add column if not exists` abaixo não converteria nada. A conversão foi
-- feita à mão e não deixa rastro no catálogo; esta é a forma explícita de
-- reproduzi-la (as datas antigas viram meia-noite no fuso da sessão).

alter table public.lancamentos
  alter column criado_em type timestamp with time zone using criado_em::timestamp with time zone,
  alter column criado_em set default now();

-- ── Colunas ──────────────────────────────────────────────────────────────

alter table public.campanhas add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.campanhas add column if not exists criado_em timestamp with time zone not null default now();
alter table public.campanhas add column if not exists criado_por uuid;
alter table public.cartoes add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.cartoes add column if not exists criado_em timestamp with time zone not null default now();
alter table public.cartoes add column if not exists criado_por uuid;
alter table public.despesas_recorrentes add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.despesas_recorrentes add column if not exists criado_em timestamp with time zone not null default now();
alter table public.despesas_recorrentes add column if not exists criado_por uuid;
alter table public.gastos add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.gastos add column if not exists criado_em timestamp with time zone not null default now();
alter table public.gastos add column if not exists criado_por uuid;
alter table public.lancamentos add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.lancamentos add column if not exists criado_em timestamp with time zone not null default now();
alter table public.lancamentos add column if not exists criado_por uuid;
alter table public.naturezas add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.naturezas add column if not exists criado_em timestamp with time zone not null default now();
alter table public.naturezas add column if not exists criado_por uuid;
alter table public.propriedades add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.propriedades add column if not exists criado_em timestamp with time zone not null default now();
alter table public.propriedades add column if not exists criado_por uuid;
alter table public.reservas add column if not exists atualizado_em timestamp with time zone not null default now();
alter table public.reservas add column if not exists criado_em timestamp with time zone not null default now();
alter table public.reservas add column if not exists criado_por uuid;

-- ── FKs para perfis ──────────────────────────────────────────────────────

alter table public.campanhas add constraint campanhas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.cartoes add constraint cartoes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.despesas_recorrentes add constraint despesas_recorrentes_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.gastos add constraint gastos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.lancamentos add constraint lancamentos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.naturezas add constraint naturezas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.propriedades add constraint propriedades_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);
alter table public.reservas add constraint reservas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES perfis(id);

-- ── Funções dos gatilhos ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.marcar_autor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 new.criado_por := auth.uid();
 new.criado_em := now();
 new.atualizado_em := now();
 return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.marcar_atualizacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 new.criado_por := old.criado_por;
 new.criado_em := old.criado_em;
 new.atualizado_em := now();
 return new;
end;
$function$
;

-- ── Gatilhos ─────────────────────────────────────────────────────────────

CREATE TRIGGER ao_inserir BEFORE INSERT ON public.campanhas FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.cartoes FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.despesas_recorrentes FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.gastos FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.naturezas FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.propriedades FOR EACH ROW EXECUTE FUNCTION marcar_autor();
CREATE TRIGGER ao_inserir BEFORE INSERT ON public.reservas FOR EACH ROW EXECUTE FUNCTION marcar_autor();

CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.cartoes FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.despesas_recorrentes FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.lancamentos FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.naturezas FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.propriedades FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
CREATE TRIGGER ao_atualizar BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION marcar_atualizacao();
