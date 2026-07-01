create table if not exists scan_attempts (
  id uuid primary key default gen_random_uuid(),
  hall_pass_id uuid references hall_passes(id) on delete set null,
  token text not null,
  scanner_email text,
  result text not null check (result in ('valid', 'used', 'invalid')),
  scanned_at timestamptz not null default now()
);

create index if not exists scan_attempts_hall_pass_id_idx on scan_attempts (hall_pass_id);
create index if not exists scan_attempts_scanned_at_idx on scan_attempts (scanned_at desc);
create index if not exists scan_attempts_scanner_email_idx on scan_attempts (scanner_email);
