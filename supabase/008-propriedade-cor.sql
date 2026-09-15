-- ─────────────────────────────────────────────────────────────────────────
-- 008 — Cor da propriedade
-- Rode UMA vez no SQL Editor, depois de 007.
--
-- Mesmo padrão de `naturezas.cor`: um hex para o ponto colorido ao lado do
-- nome, em todo lugar onde a propriedade aparece. Nullable: sem cor, o app
-- usa o cinza neutro do DS (#9da0a5) — nada quebra.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.propriedades
  add column if not exists cor text;
