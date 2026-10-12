alter table std_email_messages drop constraint std_email_messages_state_check;
alter table std_email_messages add constraint std_email_messages_state_check check(state in ('queued','provider_queued','accepted','delivered','bounced','complained','delayed','failed','unknown'));
alter table std_email_messages add column provider_event_at timestamptz;
create index std_email_provider_idx on std_email_messages(provider_id);
create table std_provider_inbox (
 adapter text not null, event_id text not null, provider_id text not null,
 status text not null, occurred_at timestamptz not null, recipients text[] not null,
 failure_code text, received_at timestamptz not null default now(), processed_at timestamptz,
 primary key(adapter,event_id)
);
