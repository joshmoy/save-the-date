create table std_invitation_designs (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),title text not null,
 config jsonb not null,version integer not null default 1,created_by uuid not null references std_users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(wedding_id,id)
);
create table std_invitation_exports (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),design_id uuid not null,
 design_version integer not null,snapshot jsonb not null,requested_by uuid not null references std_users(id),
 created_at timestamptz not null default now(),foreign key(wedding_id,design_id) references std_invitation_designs(wedding_id,id)
);
create table std_invitation_files (
 export_id uuid not null references std_invitation_exports(id),format text not null check(format in ('jpeg','pdf')),
 state text not null default 'queued' check(state in ('queued','processing','completed','failed')),
 object_key text,checksum text,bytes bigint,width integer,height integer,error_code text,
 primary key(export_id,format)
);
