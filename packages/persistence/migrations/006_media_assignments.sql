create table std_member_albums (
 wedding_id uuid not null, user_id uuid not null, album_id uuid not null,
 primary key(wedding_id,user_id,album_id),
 foreign key(wedding_id,user_id) references std_memberships(wedding_id,user_id) on delete cascade,
 foreign key(wedding_id,album_id) references std_albums(wedding_id,id)
);
