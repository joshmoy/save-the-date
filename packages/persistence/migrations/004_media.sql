create table std_media_usage (
 wedding_id uuid primary key references std_weddings(id), stored_bytes bigint not null default 0 check(stored_bytes>=0),
 reserved_bytes bigint not null default 0 check(reserved_bytes>=0), limit_bytes bigint not null default 10737418240 check(limit_bytes>0), uploads_enabled boolean not null default true
);
create table std_albums (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), unique(wedding_id,id),
 title text not null, description text not null default '', position integer not null default 0,
 visibility text not null default 'private' check(visibility in ('private','inherit','invited')),
 published boolean not null default false, cover_asset_id uuid, version integer not null default 1, deleted_at timestamptz
);
create table std_media_assets (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), unique(wedding_id,id), album_id uuid not null,
 original_key text not null unique, derivative_key text, poster_key text, filename text not null, declared_type text not null,
 expected_bytes bigint not null check(expected_bytes>0), reserved_bytes bigint not null check(reserved_bytes>=0), actual_bytes bigint not null default 0,
 checksum text, content_type text, width integer, height integer, duration numeric,
 processing text not null default 'awaiting_upload' check(processing in ('awaiting_upload','receiving','uploaded','processing','ready','rejected','expired')),
 moderation text not null default 'pending' check(moderation in ('pending','approved','rejected')),
 caption text not null default '', alt text not null default '', created_by uuid references std_users(id),
 expires_at timestamptz not null default now()+interval '30 minutes', created_at timestamptz not null default now(),
 deleted_at timestamptz, error_code text, version integer not null default 1,
 foreign key(wedding_id,album_id) references std_albums(wedding_id,id)
);
alter table std_albums add foreign key(wedding_id,cover_asset_id) references std_media_assets(wedding_id,id);
create index std_media_processing_idx on std_media_assets(processing,expires_at);
