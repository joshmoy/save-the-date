create table std_site_drafts (
 wedding_id uuid primary key references std_weddings(id),
 config jsonb not null, version integer not null default 1,
 updated_by uuid not null references std_users(id), updated_at timestamptz not null default now()
);
create table std_site_publications (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), unique(wedding_id,id),
 snapshot jsonb not null, created_by uuid not null references std_users(id), created_at timestamptz not null default now()
);
create table std_active_publications (
 wedding_id uuid primary key references std_weddings(id), publication_id uuid not null,
 foreign key(wedding_id,publication_id) references std_site_publications(wedding_id,id)
);
create table std_shared_grants (
 wedding_id uuid primary key references std_weddings(id), credential_hash text not null unique,
 generation integer not null default 1, created_at timestamptz not null default now()
);
create table std_site_sessions (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), credential_hash text not null unique,
 generation integer not null, expires_at timestamptz not null
);
create table std_posts (
 id uuid primary key, wedding_id uuid not null references std_weddings(id), unique(wedding_id,id),
 slug text not null, draft jsonb not null, version integer not null default 1,
 published jsonb, published_at timestamptz, deleted_at timestamptz,
 unique(wedding_id,slug)
);
create table std_post_paths (
 wedding_id uuid not null, slug text not null, post_id uuid not null,
 primary key(wedding_id,slug), foreign key(wedding_id,post_id) references std_posts(wedding_id,id)
);
