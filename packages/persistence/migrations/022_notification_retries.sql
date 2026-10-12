alter table std_email_messages add column retry_of uuid;
create index std_email_history_idx on std_email_messages(wedding_id,created_at desc,id desc);
create unique index std_email_one_retry_idx on std_email_messages(retry_of) where retry_of is not null;
