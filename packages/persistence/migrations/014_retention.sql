alter table std_weddings add column service_policy text not null default 'pilot-12m-30d-v1';
alter table std_weddings add column service_provisional boolean not null default true;
alter table std_weddings add column service_review_at timestamptz not null default now()+interval '90 days';
alter table std_weddings add column service_renewed_until timestamptz;
alter table std_weddings add column uploads_enabled boolean not null default true;
alter table std_weddings add column ai_enabled boolean not null default true;
alter table std_weddings add column archived_at timestamptz;
create table std_retention_notices(wedding_id uuid not null references std_weddings(id),expiry timestamptz not null,days integer not null check(days in (30,7)),created_at timestamptz not null default now(),primary key(wedding_id,expiry,days));
create table std_archive_exports(id uuid primary key,wedding_id uuid not null references std_weddings(id),requested_by uuid not null references std_users(id),operation_key uuid not null,include_sensitive boolean not null default false,snapshot jsonb not null,state text not null default 'queued' check(state in ('queued','processing','completed','failed')),object_key text,checksum text,bytes bigint,error_code text,created_at timestamptz not null default now(),unique(wedding_id,operation_key));
create table std_archive_entries(export_id uuid not null references std_archive_exports(id) on delete cascade,entry_index integer not null,archive_path text not null,source_key text not null,checksum text,bytes bigint,state text not null default 'pending' check(state in ('pending','copied','missing')),primary key(export_id,entry_index));
create table std_account_deletion_requests(user_id uuid primary key references std_users(id),requested_at timestamptz not null default now(),erase_after timestamptz not null default now()+interval '30 days',completed_at timestamptz);
create table std_erasure_objects(wedding_id uuid not null,object_key text not null,deleted_at timestamptz,primary key(wedding_id,object_key));

-- A scheduled event anchors service; unknown dates retain an explicit provisional expiry.
create function std_recalculate_service() returns trigger language plpgsql as $$
begin
 update std_weddings w set service_expires_at=greatest(coalesce((select max(coalesce(e.ends_at,e.starts_at)) from std_events e where e.wedding_id=w.id)+interval '1 year',w.created_at+interval '1 year'),coalesce(w.service_renewed_until,'-infinity'::timestamptz)),service_provisional=not exists(select 1 from std_events e where e.wedding_id=w.id and e.starts_at is not null) where w.id=coalesce(new.wedding_id,old.wedding_id) and w.archived_at is null and w.deleted_at is null;
 return null;
end $$;
create trigger std_events_service after insert or update of starts_at,ends_at or delete on std_events for each row execute function std_recalculate_service();
update std_weddings w set service_expires_at=coalesce((select max(coalesce(e.ends_at,e.starts_at)) from std_events e where e.wedding_id=w.id)+interval '1 year',w.created_at+interval '1 year'),service_provisional=not exists(select 1 from std_events e where e.wedding_id=w.id and e.starts_at is not null);
