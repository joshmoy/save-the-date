alter table std_weddings add column ai_concept_daily_limit integer check(ai_concept_daily_limit between 0 and 100);
alter table std_weddings add column ai_board_daily_limit integer check(ai_board_daily_limit between 0 and 100);
create table std_metrics_events(id uuid primary key,wedding_id uuid not null,event_type text not null check(event_type in ('wedding_created','first_publication','invitation_export','event_response','successful_admission','approved_upload','approved_concept','brief_export')),dedupe_key text not null unique,created_at timestamptz not null default now());
create index std_metrics_events_type_time on std_metrics_events(event_type,created_at);
create table std_support_reports(id uuid primary key,wedding_id uuid,kind text not null check(kind in ('abuse','rights','account','technical')),contact_email text,description text not null,state text not null default 'open' check(state in ('open','reviewing','resolved')),created_at timestamptz not null default now(),resolved_at timestamptz);
create table std_operator_media_grants(id uuid primary key,wedding_id uuid not null,asset_id uuid not null,operator_id uuid not null references std_users(id),reason text not null,expires_at timestamptz not null,created_at timestamptz not null default now());
alter table std_weddings add column uploads_operator_disabled boolean not null default false;
alter table std_weddings add column ai_operator_disabled boolean not null default false;
alter table std_weddings add column public_hold boolean not null default false;
