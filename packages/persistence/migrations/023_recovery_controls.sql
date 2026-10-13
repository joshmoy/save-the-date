alter table std_weddings add column publication_recovery_hold boolean not null default false;
alter table std_admissions alter column actor_id drop not null;
create table std_admission_recovery_holds (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),pass_id uuid not null,
 reason text not null check(reason in ('UNCERTAIN_ADMISSION','MISSING_LINEAGE','LINEAGE_MISMATCH')),
 state text not null default 'open' check(state in ('open','resolved')),
 created_at timestamptz not null default now(),resolved_at timestamptz,resolved_by uuid references std_users(id),resolution_reason text,
 unique(wedding_id,pass_id)
);
