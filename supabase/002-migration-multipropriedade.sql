-- ─────────────────────────────────────────────────────────────────────────
-- Migração: multipropriedade
-- Rode este bloco UMA vez no SQL Editor do Supabase (não apaga dados).
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Tabela de propriedades
create table if not exists propriedades (
  id            text primary key,
  nome          text        not null,
  ordem         integer     not null default 0,
  created_at    timestamptz not null default now()
);

-- 2) Semear as propriedades atuais
insert into propriedades (id, nome, ordem) values
  ('colonial',         'Hotel Colonial',   1),
  ('posada-cataratas', 'Posada Cataratas', 2)
on conflict (id) do nothing;

-- 3) Coluna propriedade_id nas três tabelas de dados
alter table campanhas add column if not exists propriedade_id text references propriedades(id);
alter table reservas  add column if not exists propriedade_id text references propriedades(id);
alter table gastos    add column if not exists propriedade_id text references propriedades(id);

-- 4) Todos os dados que já existem passam a ser do Hotel Colonial
update campanhas set propriedade_id = 'colonial' where propriedade_id is null;
update reservas  set propriedade_id = 'colonial' where propriedade_id is null;
update gastos    set propriedade_id = 'colonial' where propriedade_id is null;

-- 5) Índices
create index if not exists campanhas_prop_idx on campanhas (propriedade_id);
create index if not exists reservas_prop_idx  on reservas  (propriedade_id);
create index if not exists gastos_prop_idx    on gastos    (propriedade_id);

-- 6) RLS para a tabela nova. Use o MESMO padrão de acesso das suas outras
--    tabelas. Como o app lê/escreve com a chave pública (anon), estas policies
--    são permissivas — ajuste se o seu projeto exigir autenticação.
alter table propriedades enable row level security;
create policy "propriedades read"  on propriedades for select using (true);
create policy "propriedades write" on propriedades for all    using (true) with check (true);
