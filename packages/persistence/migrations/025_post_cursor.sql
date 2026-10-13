-- Existing draft creation times were not recorded. Use the first known publication
-- timestamp, or migration time for an unpublished draft; never infer private history.
alter table std_posts add column created_at timestamptz not null default now();
update std_posts set created_at=published_at where published_at is not null;
create index std_posts_staff_cursor on std_posts(wedding_id,created_at desc,id desc) where deleted_at is null;
