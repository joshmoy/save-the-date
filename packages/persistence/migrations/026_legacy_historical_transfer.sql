create table std_legacy_transfers (
 wedding_id uuid primary key references std_weddings(id),source_checksum text not null,
 mapping_checksum text not null,source_frozen_at timestamptz not null,
 state text not null default 'held' check(state='held'),completed_at timestamptz,
 reconciliation jsonb not null,created_by uuid not null references std_users(id),created_at timestamptz not null default now()
);
