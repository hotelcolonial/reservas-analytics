-- ─────────────────────────────────────────────────────────────────────────
-- 007 — Propriedade opcional no lançamento
-- Rode UMA vez no SQL Editor, depois de 006.
--
-- Um lançamento do módulo Gastos pode pertencer a uma propriedade (ex.: a
-- recarga de saldo de mídia do Hotel Colonial) ou a nenhuma. NULL é
-- proposital e é o padrão: gastos de escritório (aluguel, contador) não são
-- de hotel nenhum, e um gasto compartilhado entre as duas propriedades fica
-- vazio em vez de ser atribuído a uma delas.
--
-- Isto NÃO liga o módulo Gastos ao seletor de propriedade ativa do
-- ReservaTrack: em /gastos/lancamentos há um filtro próprio, com "todas"
-- como padrão (ver GASTOS.md).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.lancamentos
  add column if not exists propriedade_id text references public.propriedades(id);

create index if not exists lancamentos_propriedade_idx on public.lancamentos (propriedade_id);
