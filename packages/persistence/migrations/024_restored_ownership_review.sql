-- A restored snapshot must not reinstate primary-owner privileges without current ownership review.
alter table std_weddings add column ownership_recovery_hold boolean not null default false;
