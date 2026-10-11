-- Preserve imported content without publishing it or changing legacy tables.
create table std_legacy_snapshots (
 wedding_id uuid primary key references std_weddings(id),
 source_checksum text not null,
 source_data jsonb not null,
 imported_at timestamptz not null default now()
);
