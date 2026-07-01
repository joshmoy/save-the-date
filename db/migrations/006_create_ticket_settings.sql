create table if not exists ticket_settings (
  id boolean primary key default true,
  ticket_limit integer check (ticket_limit is null or ticket_limit >= 0),
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint ticket_settings_single_row check (id)
);

insert into ticket_settings (id, ticket_limit)
values (true, null)
on conflict (id) do nothing;

create or replace function create_hall_pass_if_available(
  pass_token text,
  pass_guest_name text default null,
  creator_email text default null
)
returns table (
  id uuid,
  token text,
  guest_name text,
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
  insert into hall_passes (token, guest_name, created_by)
  values (pass_token, nullif(trim(pass_guest_name), ''), creator_email)
  returning hall_passes.id,
            hall_passes.token,
            hall_passes.guest_name,
            hall_passes.created_by,
            hall_passes.created_at,
            hall_passes.used_at,
            hall_passes.used_by,
            hall_passes.invalidated_at,
            hall_passes.invalidated_by;
end;
$$;
