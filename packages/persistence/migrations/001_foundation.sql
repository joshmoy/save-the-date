create table std_users (
 id uuid primary key, email text not null unique, password_hash text not null,
 verified_at timestamptz, created_at timestamptz not null default now(), deleted_at timestamptz
);
create table std_sessions (
 id uuid primary key, user_id uuid not null references std_users(id), credential_hash text not null unique,
 expires_at timestamptz not null, revoked_at timestamptz, reauthenticated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index std_sessions_user_idx on std_sessions(user_id);
create table std_identity_tokens (
 id uuid primary key, user_id uuid not null references std_users(id), purpose text not null check(purpose in ('verify','reset')),
 token_hash text not null unique, expires_at timestamptz not null, consumed_at timestamptz
);
create table std_weddings (
 id uuid primary key, slug text not null unique, primary_owner_id uuid not null references std_users(id),
 display_names text not null, timezone text not null, primary_date date, locale text not null default 'en', palette jsonb not null,
 lifecycle text not null default 'planning' check(lifecycle in ('planning','wedding_period','memories','archived')),
 site_visibility text not null default 'shared' check(site_visibility in ('shared','public')),
 published_at timestamptz, version integer not null default 1 check(version>0),
 deleted_at timestamptz, recovery_until timestamptz, service_expires_at timestamptz not null default now()+interval '1 year',
 created_at timestamptz not null default now()
);
create table std_events (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), unique(wedding_id,id),
 title text not null, type text not null check(type in ('traditional','civil','religious','reception','custom')),
 timezone text not null, starts_at timestamptz, ends_at timestamptz, to_be_confirmed text,
 venue text not null default '', directions text not null default '', dress_code text not null default '',
 rsvp_cutoff timestamptz, capacity integer check(capacity>=0), confirmed_count integer not null default 0 check(confirmed_count>=0),
 visibility text not null default 'invited' check(visibility in ('public','invited')),
 approval_policy text not null default 'automatic' check(approval_policy in ('automatic','manual')),
 admission_policy text not null default 'disabled' check(admission_policy in ('disabled','automatic','owner')),
 admission_starts_at timestamptz, admission_ends_at timestamptz,
 version integer not null default 1, created_at timestamptz not null default now(),
 check(capacity is null or confirmed_count<=capacity), check(starts_at is not null or length(to_be_confirmed)>0),
 check(ends_at is null or starts_at is null or ends_at>starts_at),
 check((admission_starts_at is null and admission_ends_at is null) or admission_ends_at>admission_starts_at)
);
create index std_events_tenant_idx on std_events(wedding_id);
create table std_memberships (
 wedding_id uuid not null references std_weddings(id), user_id uuid not null references std_users(id),
 role text not null check(role in ('owner','co_owner','planner','media_contributor','security')),
 primary key(wedding_id,user_id), created_at timestamptz not null default now()
);
create unique index std_one_owner_idx on std_memberships(wedding_id) where role='owner';
create table std_member_events (
 wedding_id uuid not null, user_id uuid not null, event_id uuid not null,
 primary key(wedding_id,user_id,event_id), foreign key(wedding_id,user_id) references std_memberships(wedding_id,user_id) on delete cascade,
 foreign key(wedding_id,event_id) references std_events(wedding_id,id)
);
create table std_member_invites (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), email text not null, role text not null check(role in ('co_owner','planner','media_contributor','security')),
 token_hash text not null unique, event_ids uuid[] not null default '{}', album_ids uuid[] not null default '{}',
 invited_by uuid not null references std_users(id), expires_at timestamptz not null, revoked_at timestamptz, accepted_at timestamptz,
 created_at timestamptz not null default now()
);
create table std_audit_events (
 id uuid primary key, wedding_id uuid references std_weddings(id), actor_id uuid references std_users(id),
 action text not null, resource_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table std_jobs (
 id uuid primary key, wedding_id uuid references std_weddings(id), requested_by uuid references std_users(id), type text not null,
 dedupe_key text not null unique, payload jsonb not null,
 state text not null default 'pending' check(state in ('pending','leased','running','succeeded','failed','cancelled','unknown_external')),
 attempts integer not null default 0, lease_owner text, lease_until timestamptz, retry_at timestamptz not null default now(),
 result jsonb, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index std_jobs_ready_idx on std_jobs(state,retry_at);
create table std_email_messages (
 id uuid primary key, wedding_id uuid references std_weddings(id), recipient text not null, subject text not null,
 state text not null default 'queued' check(state in ('queued','accepted','delivered','bounced','failed','unknown')),
 provider_id text, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table std_rate_limits (key text primary key, window_start timestamptz not null, count integer not null);
create table std_deletion_tombstones (wedding_id uuid primary key, requested_at timestamptz not null default now(), erase_after timestamptz not null, erased_at timestamptz);
