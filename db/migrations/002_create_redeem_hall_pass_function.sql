create or replace function redeem_hall_pass(pass_token text, scanner_name text default null)
returns table (
  id uuid,
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
  returning hp.id, hp.guest_name, 'valid'::text, hp.used_at;

  if found then
    return;
  end if;

  return query
  select hp.id,
         hp.guest_name,
         'used'::text,
         hp.used_at
  from hall_passes hp
  where hp.token = pass_token;

  if found then
    return;
  end if;

  return query
  select null::uuid,
         null::text,
         'invalid'::text,
         null::timestamptz;
end;
$$;
