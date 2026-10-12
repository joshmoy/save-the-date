create table std_creative_contexts (
 wedding_id uuid primary key references std_weddings(id),config jsonb not null,version integer not null default 1,
 updated_by uuid not null references std_users(id),updated_at timestamptz not null default now()
);
create table std_concepts (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),current_revision integer not null default 1,
 state text not null check(state in ('draft','generated','revised','approved','superseded')),approved_revision integer,approved_at timestamptz,approved_by uuid references std_users(id),
 created_by uuid not null references std_users(id),created_at timestamptz not null default now(),unique(wedding_id,id)
);
create table std_concept_revisions (
 wedding_id uuid not null,concept_id uuid not null,revision integer not null,context_version integer not null,
 concept jsonb not null,context_snapshot jsonb not null,provenance jsonb not null,created_by uuid references std_users(id),created_at timestamptz not null default now(),
 primary key(wedding_id,concept_id,revision),foreign key(wedding_id,concept_id) references std_concepts(wedding_id,id)
);
create table std_creative_usage (
 wedding_id uuid not null references std_weddings(id),day date not null,
 concept_runs integer not null default 0 check(concept_runs>=0),board_runs integer not null default 0 check(board_runs>=0),
 primary key(wedding_id,day)
);
create table std_creative_runs (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),requested_by uuid not null references std_users(id),
 kind text not null check(kind in ('concepts','revision','board','question')),day date not null,
 state text not null default 'queued' check(state in ('queued','working','submitted','completed','failed','unknown_external','cancelled')),
 context_version integer not null,context_snapshot jsonb not null,concept_id uuid,concept_revision integer,instruction text not null,
 reserved_bytes bigint not null default 0 check(reserved_bytes>=0),allowance_reserved boolean not null default true,estimated_credits integer not null,estimated_charge numeric,provider_id text,
 result jsonb,usage jsonb,error_code text,cancelled_at timestamptz,created_at timestamptz not null default now(),
 foreign key(wedding_id,concept_id) references std_concepts(wedding_id,id),unique(wedding_id,id)
);
create table std_creative_assets (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),run_id uuid not null references std_creative_runs(id),
 object_key text not null unique,checksum text not null,content_type text not null,bytes bigint not null,
 provenance jsonb not null,created_at timestamptz not null default now(),unique(wedding_id,id)
);
create table std_planner_briefs (
 id uuid primary key,wedding_id uuid not null references std_weddings(id),concept_id uuid not null,revision integer not null,
 snapshot jsonb not null,requested_by uuid not null references std_users(id),created_at timestamptz not null default now(),
 foreign key(wedding_id,concept_id,revision) references std_concept_revisions(wedding_id,concept_id,revision),unique(wedding_id,id)
);
create table std_planner_brief_files (
 brief_id uuid not null references std_planner_briefs(id),format text not null check(format in ('pdf','json')),
 state text not null default 'queued' check(state in ('queued','processing','completed','failed')),
 object_key text,checksum text,bytes bigint,error_code text,primary key(brief_id,format)
);

alter table std_weddings add column design_font_heading text check(design_font_heading in ('Cormorant','Lora','Source Serif 4'));
