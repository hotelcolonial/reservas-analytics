-- ReservaTrack Colonial — Supabase schema
-- Run this in the Supabase SQL Editor to create the required tables.

create table if not exists campanhas (
  id            text primary key,
  nome          text        not null,
  plataforma    text        not null,
  tipo          text        not null,
  data_inicio   text        not null,
  data_fim      text        not null,
  investimento  numeric     not null default 0,
  status        text        not null default 'ativa',
  observacoes   text,
  utm           text,
  created_at    timestamptz not null default now()
);

create table if not exists reservas (
  id            text primary key,
  codigo        text        not null,
  data_reserva  text        not null,
  check_in      text        not null,
  check_out     text        not null,
  campanha_id   text        references campanhas(id) on delete set null,
  plataforma    text        not null,
  valor         numeric     not null default 0,
  pax           integer     not null default 1,
  noites        integer     not null default 0,
  tipo_quarto   text,
  status        text        not null default 'confirmada',
  atendente     text        not null default '',
  observacoes   text,
  created_at    timestamptz not null default now()
);

-- Enable Row Level Security (RLS) — adjust policies to your auth setup.
alter table campanhas enable row level security;
alter table reservas   enable row level security;

-- Allow full access for authenticated users (adjust as needed).
create policy "Authenticated users can read campanhas"
  on campanhas for select using (auth.role() = 'authenticated');

create policy "Authenticated users can write campanhas"
  on campanhas for all using (auth.role() = 'authenticated');

create policy "Authenticated users can read reservas"
  on reservas for select using (auth.role() = 'authenticated');

create policy "Authenticated users can write reservas"
  on reservas for all using (auth.role() = 'authenticated');
