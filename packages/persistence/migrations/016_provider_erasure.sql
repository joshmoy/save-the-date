create table std_erased_provider_refs(adapter text not null,provider_hash text not null,created_at timestamptz not null default now(),primary key(adapter,provider_hash));
