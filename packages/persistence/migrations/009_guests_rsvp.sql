create table std_parties (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),name text not null,
 version integer not null default 1,deleted_at timestamptz,created_at timestamptz not null default now(),unique(wedding_id,id)
);
create table std_attendees (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),party_id uuid not null,
 name text not null,email text,phone text not null default '',group_name text not null default '',
 plus_one_of uuid,version integer not null default 1,deleted_at timestamptz,created_at timestamptz not null default now(),
 unique(wedding_id,id),foreign key(wedding_id,party_id) references std_parties(wedding_id,id),
 foreign key(wedding_id,plus_one_of) references std_attendees(wedding_id,id)
);
create table std_attendee_events (
 wedding_id uuid not null,attendee_id uuid not null,event_id uuid not null,
 primary key(wedding_id,attendee_id,event_id),foreign key(wedding_id,attendee_id) references std_attendees(wedding_id,id),
 foreign key(wedding_id,event_id) references std_events(wedding_id,id)
);
create table std_guest_grants (
 id uuid primary key,wedding_id uuid not null,party_id uuid not null,token_hash text not null unique,code_hash text not null unique,
 expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now(),
 foreign key(wedding_id,party_id) references std_parties(wedding_id,id)
);
create unique index std_party_active_grant on std_guest_grants(wedding_id,party_id) where revoked_at is null;
create table std_guest_sessions (
 id uuid primary key,grant_id uuid not null references std_guest_grants(id),token_hash text not null unique,
 expires_at timestamptz not null,created_at timestamptz not null default now()
);
create table std_rsvps (
 wedding_id uuid not null,attendee_id uuid not null,event_id uuid not null,
 state text not null check(state in ('unanswered','pending','confirmed','declined','waitlisted')),
 meal text not null default '',dietary text not null default '',accessibility text not null default '',note text not null default '',
 version integer not null default 1,updated_at timestamptz not null default now(),
 primary key(wedding_id,attendee_id,event_id),foreign key(wedding_id,attendee_id,event_id) references std_attendee_events(wedding_id,attendee_id,event_id)
);
create table std_reservations (
 wedding_id uuid not null,attendee_id uuid not null,event_id uuid not null,created_at timestamptz not null default now(),
 primary key(wedding_id,attendee_id,event_id),foreign key(wedding_id,attendee_id,event_id) references std_attendee_events(wedding_id,attendee_id,event_id)
);
create table std_event_questions (
 wedding_id uuid not null,event_id uuid not null,meal boolean not null default false,dietary boolean not null default false,
 accessibility boolean not null default false,note boolean not null default false,
 primary key(wedding_id,event_id),foreign key(wedding_id,event_id) references std_events(wedding_id,id)
);
create table std_access_requests (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),name text not null,email text not null,note text not null,
 state text not null default 'pending' check(state in ('pending','approved','rejected')),party_id uuid,
 created_at timestamptz not null default now(),foreign key(wedding_id,party_id) references std_parties(wedding_id,id)
);
-- Admission lineage is needed by RSVP changes; the pass issue/redemption slice follows.
create table std_passes (
 id uuid primary key,wedding_id uuid not null,attendee_id uuid not null,event_id uuid not null,
 status text not null check(status in ('active','revoked','used','expired')),credential_hash text unique,manual_hash text unique,
 encrypted_payload jsonb,version integer not null default 1,used_at timestamptz,used_by uuid references std_users(id),
 issued_at timestamptz not null default now(),revoked_reason text,
 unique(wedding_id,attendee_id,event_id),unique(wedding_id,id),foreign key(wedding_id,attendee_id,event_id) references std_attendee_events(wedding_id,attendee_id,event_id)
);
create table std_admissions (
 id uuid primary key,wedding_id uuid not null,pass_id uuid not null unique,event_id uuid not null,attendee_id uuid not null,
 admitted_at timestamptz not null default now(),actor_id uuid not null references std_users(id),
 foreign key(wedding_id,pass_id) references std_passes(wedding_id,id)
);
create table std_pass_history (
 id uuid primary key,wedding_id uuid not null,pass_id uuid not null,action text not null,actor_id uuid references std_users(id),
 reason text,created_at timestamptz not null default now(),foreign key(wedding_id,pass_id) references std_passes(wedding_id,id)
);
