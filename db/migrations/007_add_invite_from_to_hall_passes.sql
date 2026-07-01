alter table hall_passes
add column if not exists invite_from text;

create index if not exists hall_passes_invite_from_idx on hall_passes (invite_from);

create or replace function create_hall_pass_if_available(
  pass_token text,
  pass_guest_name text default null,
  creator_email text default null,
  pass_invite_from text default null
)
returns table (
  id uuid,
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
