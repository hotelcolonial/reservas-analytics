-- ─────────────────────────────────────────────────────────────────────────
-- 004 — Perfis de usuário
-- Rode UMA vez no SQL Editor, depois de 001–003.
--
-- Tabela public.perfis (um perfil por usuário do Auth), criada sozinha por
-- trigger quando alguém entra em auth.users. Só leitura para quem está
-- logado; quem cadastra/ativa gente é o Dashboard.
--
-- Origem: extraído do banco real com supabase/extrair-estado.sql
-- (pg_attribute, pg_get_constraintdef, pg_get_functiondef, pg_get_triggerdef,
-- pg_policies) em 2026-09-14. SQL transcrito como veio, sem reescrita.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Tabela ───────────────────────────────────────────────────────────────

create table if not exists public.perfis (
 id uuid not null,
 nome text,
 email text,
 papel text not null default 'membro'::text,
 ativo boolean not null default true,
 criado_em timestamp with time zone not null default now()
);

alter table public.perfis add constraint perfis_pkey PRIMARY KEY (id);
alter table public.perfis add constraint perfis_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── RLS ──────────────────────────────────────────────────────────────────

alter table public.perfis enable row level security;

create policy "perfis: leitura autenticada" on public.perfis as permissive for select to authenticated using (true);

-- ── Criação automática do perfil ao entrar em auth.users ─────────────────

CREATE OR REPLACE FUNCTION public.criar_perfil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 insert into public.perfis (id, email, nome)
 values (
 new.id,
 new.email,
 coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1))
 )
 on conflict (id) do nothing;
 return new;
end;
$function$
;

CREATE TRIGGER ao_criar_usuario AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION criar_perfil();
