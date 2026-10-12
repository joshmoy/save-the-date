create table std_guest_publication_events (
 publication_id uuid not null references std_site_publications(id),wedding_id uuid not null,event_id uuid not null,
 snapshot jsonb not null,primary key(publication_id,event_id),
 foreign key(wedding_id,event_id) references std_events(wedding_id,id)
);
