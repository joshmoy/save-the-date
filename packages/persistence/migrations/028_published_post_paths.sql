-- Reservation alone is not evidence that a path was approved for publication.
alter table std_post_paths add column was_published boolean not null default false;
update std_post_paths a set was_published=true
from std_posts p
where p.wedding_id=a.wedding_id and p.id=a.post_id
  and p.published is not null and p.published->>'slug'=a.slug;
