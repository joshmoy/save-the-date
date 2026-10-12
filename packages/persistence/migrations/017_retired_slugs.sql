create table std_retired_slugs(slug_hash text primary key,wedding_id uuid not null,retired_at timestamptz not null default now());
