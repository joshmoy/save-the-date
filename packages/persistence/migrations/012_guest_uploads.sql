create table std_upload_grants (
 id uuid primary key,wedding_id uuid not null,event_id uuid not null,album_id uuid not null,
 token_hash text not null unique,code_hash text not null unique,expires_at timestamptz not null,revoked_at timestamptz,
 session_file_limit integer not null default 20 check(session_file_limit between 1 and 100),
 session_byte_limit bigint not null default 524288000 check(session_byte_limit between 1 and 2147483648),
 created_by uuid not null references std_users(id),created_at timestamptz not null default now(),
 foreign key(wedding_id,event_id) references std_events(wedding_id,id),foreign key(wedding_id,album_id) references std_albums(wedding_id,id),unique(wedding_id,id)
);
create table std_upload_sessions (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),token_hash text not null unique,
 upload_grant_id uuid references std_upload_grants(id),guest_grant_id uuid references std_guest_grants(id),
 expires_at timestamptz not null,files_reserved integer not null default 0,bytes_reserved bigint not null default 0,
 file_limit integer not null,byte_limit bigint not null,created_at timestamptz not null default now(),
 check((upload_grant_id is null) <> (guest_grant_id is null)),unique(wedding_id,id)
);
alter table std_media_assets add column upload_session_id uuid;
alter table std_media_assets add foreign key(wedding_id,upload_session_id) references std_upload_sessions(wedding_id,id);
alter table std_albums add column guest_uploads boolean not null default false;
