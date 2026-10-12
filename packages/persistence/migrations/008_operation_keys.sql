create table std_operation_keys (
 wedding_id uuid not null references std_weddings(id),actor_id text not null,operation text not null,key uuid not null,
 request_hash text not null,result jsonb not null,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 days',
 primary key(wedding_id,actor_id,operation,key)
);
