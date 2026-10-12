create function std_refresh_service(wid uuid) returns void language sql as $$
 update std_weddings w set service_expires_at=greatest(coalesce((select max(coalesce(e.ends_at,e.starts_at)) from std_events e where e.wedding_id=w.id),case when w.primary_date is not null then (w.primary_date+1)::timestamp at time zone w.timezone end,w.created_at)+interval '1 year',coalesce(w.service_renewed_until,'-infinity'::timestamptz)),service_provisional=w.primary_date is null and not exists(select 1 from std_events e where e.wedding_id=w.id and e.starts_at is not null) where w.id=wid and w.archived_at is null and w.deleted_at is null;
$$;
create or replace function std_recalculate_service() returns trigger language plpgsql as $$ begin perform std_refresh_service(coalesce(new.wedding_id,old.wedding_id));return null;end $$;
create function std_wedding_service() returns trigger language plpgsql as $$ begin perform std_refresh_service(new.id);return null;end $$;
create trigger std_wedding_service_date after insert or update of primary_date,timezone on std_weddings for each row execute function std_wedding_service();
select std_refresh_service(id) from std_weddings;
