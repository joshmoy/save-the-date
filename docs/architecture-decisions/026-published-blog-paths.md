# 026 — Blog path reservation is separate from publication

2026-10-14. B01/B02/S02.

Saving a draft previously reserved its slug in std_post_paths; public lookup treated every reserved slug as a live alias. Thus an unapproved draft URL could redirect visitors to the existing published article. Draft content stayed private, but the new path was public before approval.

Migration028 adds was_published. Owner publication marks the exact published slug in the same transaction as the immutable post revision. Public lookup requires this marker, while draft reservation still prevents another post from taking the slug. Previously approved paths remain aliases after a later rename; unpublishing/deletion and site/invited access checks still apply.

Older records contain no reliable per-path approval history. Backfill marks only the current published slug. Other reservations are preserved but unavailable publicly until reviewed and published by an owner. This deliberately avoids guessing whether old paths were drafts. Existing canonical article URLs remain available; some historical aliases may require review. No stored content, reservation or wedding data is removed.

Verification: focused publication tests cover draft-path404, unchanged existing publication, approved rename redirect, reserved-path conflict, unpublish, shared/invited boundaries and the migration's conservative backfill. No invitation renderer or complete suite is required for this change.
