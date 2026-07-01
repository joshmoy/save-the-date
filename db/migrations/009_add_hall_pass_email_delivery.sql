alter table hall_passes
add column if not exists email_recipient text,
add column if not exists email_status text not null default 'not_sent',
add column if not exists email_sent_at timestamptz,
add column if not exists email_error text;

create index if not exists hall_passes_email_status_idx on hall_passes (email_status);
create index if not exists hall_passes_email_recipient_idx on hall_passes (email_recipient);
