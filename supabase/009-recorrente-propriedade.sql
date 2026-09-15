-- ─────────────────────────────────────────────────────────────────────────
-- 009 — Propriedade opcional na despesa recorrente
-- Rode UMA vez no SQL Editor, depois de 008.
--
-- O molde passa a carregar a propriedade, e a geração copia para cada
-- lançamento gerado. Mesma lógica de lancamentos.propriedade_id: NULL é o
-- padrão e significa Escritório / Geral.
--
-- Mudar a propriedade do molde NÃO altera lançamentos já gerados (como mudar
-- o valor não altera os anteriores): só vale dos próximos em diante.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.despesas_recorrentes
  add column if not exists propriedade_id text references public.propriedades(id);
