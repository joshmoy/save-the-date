create table std_scan_operations (
 id uuid primary key,wedding_id uuid not null,event_id uuid not null,actor_id uuid not null references std_users(id),
 operation_key uuid not null,request_hash text not null,outcome jsonb not null,pass_id uuid,
 created_at timestamptz not null default now(),unique(wedding_id,actor_id,event_id,operation_key),
 foreign key(wedding_id,event_id) references std_events(wedding_id,id),foreign key(wedding_id,pass_id) references std_passes(wedding_id,id)
);
create table std_pass_files (
 wedding_id uuid not null,pass_id uuid not null,pass_version integer not null,format text not null check(format in ('jpeg','pdf')),
 state text not null default 'queued' check(state in ('queued','processing','completed','failed')),object_key text,checksum text,error_code text,
 primary key(pass_id,pass_version,format),foreign key(wedding_id,pass_id) references std_passes(wedding_id,id)
);
create table std_admission_corrections (
 id uuid primary key,wedding_id uuid not null,event_id uuid not null,attendee_id uuid not null,actor_id uuid not null references std_users(id),
 reason text not null,previous_state jsonb not null,correction jsonb not null,created_at timestamptz not null default now(),
 foreign key(wedding_id,attendee_id,event_id) references std_attendee_events(wedding_id,attendee_id,event_id)
);
