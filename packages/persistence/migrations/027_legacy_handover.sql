alter table std_legacy_transfers drop constraint std_legacy_transfers_state_check;
alter table std_legacy_transfers add constraint std_legacy_transfers_state_check check(state in ('held','released'));
alter table std_legacy_transfers add column released_at timestamptz;
alter table std_legacy_transfers add column released_by uuid references std_users(id);
alter table std_legacy_transfers add column release_evidence jsonb;
alter table std_legacy_transfers add constraint std_legacy_release_complete check(
 (state='held' and released_at is null and released_by is null and release_evidence is null) or
 (state='released' and completed_at is not null and released_at is not null and released_by is not null and release_evidence is not null)
);
