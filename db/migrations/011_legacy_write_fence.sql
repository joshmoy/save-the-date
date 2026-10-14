-- Expand-only. Normal legacy behaviour is unchanged until an authorised cutover freezes writes.
create table legacy_write_fence (
 id boolean primary key default true check(id),frozen boolean not null default false,
 frozen_at timestamptz,reason text,check(not frozen or (frozen_at is not null and length(reason)>=20))
);
insert into legacy_write_fence(id) values(true);

create function enforce_legacy_write_fence() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare held boolean;
begin
 select frozen into held from public.legacy_write_fence where id=true for share;
 if held then raise exception using errcode='55000',message='LEGACY_WRITES_FROZEN';end if;
 return null;
end;
$$;
create trigger legacy_pass_write_fence before insert or update or delete or truncate on hall_passes for each statement execute function enforce_legacy_write_fence();
create trigger legacy_scan_write_fence before insert or update or delete or truncate on scan_attempts for each statement execute function enforce_legacy_write_fence();
create trigger legacy_settings_write_fence before insert or update or delete or truncate on ticket_settings for each statement execute function enforce_legacy_write_fence();
create trigger legacy_identity_write_fence before insert or update or delete or truncate on app_users for each statement execute function enforce_legacy_write_fence();
