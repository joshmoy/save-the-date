create extension if not exists pgcrypto;

create table if not exists hall_passes (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  guest_name text,
  created_by text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by text
);

create index if not exists hall_passes_token_idx on hall_passes (token);
create index if not exists hall_passes_created_at_idx on hall_passes (created_at desc);
create index if not exists hall_passes_used_at_idx on hall_passes (used_at);
