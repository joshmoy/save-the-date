create sequence if not exists hall_passes_ticket_number_seq;

alter table hall_passes
add column if not exists ticket_number integer;

with numbered as (
  select id,
         row_number() over (order by created_at asc, id asc)::integer as next_ticket_number
  from hall_passes
  where ticket_number is null
)
update hall_passes hp
set ticket_number = numbered.next_ticket_number
from numbered
where hp.id = numbered.id;

do $$
declare
  current_max integer;
begin
  select coalesce(max(ticket_number), 0)
  into current_max
  from hall_passes;

  perform setval('hall_passes_ticket_number_seq', greatest(current_max, 1), current_max > 0);
end;
$$;

alter table hall_passes
alter column ticket_number set default nextval('hall_passes_ticket_number_seq'),
alter column ticket_number set not null;

create unique index if not exists hall_passes_ticket_number_idx on hall_passes (ticket_number);

drop function if exists redeem_hall_pass(text, text);

create function redeem_hall_pass(pass_token text, scanner_name text default null)
returns table (
  id uuid,
  ticket_number integer,
  guest_name text,
  status text,
  used_at timestamptz
)
language plpgsql
as $$
begin
  return query
  update hall_passes hp
  set used_at = now(),
      used_by = scanner_name
  where hp.token = pass_token
    and hp.used_at is null
    and hp.invalidated_at is null
  returning hp.id, hp.ticket_number, hp.guest_name, 'valid'::text, hp.used_at;

  if found then
    return;
  end if;

  return query
  select hp.id,
         hp.ticket_number,
         hp.guest_name,
         case
           when hp.invalidated_at is not null then 'invalid'
           when hp.used_at is not null then 'used'
           else 'invalid'
         end,
         hp.used_at
  from hall_passes hp
  where hp.token = pass_token;

  if found then
    return;
  end if;

  return query
  select null::uuid,
         null::integer,
         null::text,
         'invalid'::text,
         null::timestamptz;
end;
$$;

drop function if exists create_hall_pass_if_available(text, text, text, text);

create function create_hall_pass_if_available(
  pass_token text,
  pass_guest_name text default null,
  creator_email text default null,
  pass_invite_from text default null
)
returns table (
  id uuid,
  ticket_number integer,
  token text,
  guest_name text,
  invite_from text,
  created_by text,
  created_at timestamptz,
  used_at timestamptz,
  used_by text,
  invalidated_at timestamptz,
  invalidated_by text
)
language plpgsql
as $$
declare
  configured_limit integer;
  issued_count integer;
begin
  select ticket_limit
  into configured_limit
  from ticket_settings
  where ticket_settings.id = true
  for update;

  if configured_limit is not null then
    select count(*)
    into issued_count
    from hall_passes;

    if issued_count >= configured_limit then
      return;
    end if;
  end if;

  return query
  insert into hall_passes (token, guest_name, invite_from, created_by)
  values (pass_token, nullif(trim(pass_guest_name), ''), nullif(trim(pass_invite_from), ''), creator_email)
  returning hall_passes.id,
            hall_passes.ticket_number,
            hall_passes.token,
            hall_passes.guest_name,
            hall_passes.invite_from,
            hall_passes.created_by,
            hall_passes.created_at,
            hall_passes.used_at,
            hall_passes.used_by,
            hall_passes.invalidated_at,
            hall_passes.invalidated_by;
end;
$$;
