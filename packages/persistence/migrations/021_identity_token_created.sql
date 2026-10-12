alter table std_identity_tokens add column created_at timestamptz;
update std_identity_tokens set created_at=expires_at-case when purpose='verify' then interval '24 hours' else interval '30 minutes' end;
alter table std_identity_tokens alter column created_at set default now();
alter table std_identity_tokens alter column created_at set not null;
