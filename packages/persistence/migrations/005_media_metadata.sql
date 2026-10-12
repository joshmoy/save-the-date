alter table std_media_assets add column position integer not null default 0 check(position>=0);
alter table std_media_assets add column consented_at timestamptz not null default now();
