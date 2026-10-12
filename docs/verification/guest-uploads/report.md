# Guest upload verification — 2026-10-12

61 automated tests passed, zero failures/skips. Added coverage proves dedicated upload credentials cannot RSVP or view invited albums; valid RSVP sessions can obtain album-scoped uploads; revoked source grants invalidate sessions; concurrent one-file reservations have exactly one winner; guests cannot transfer into another session's asset; worker permission revocation rejects unfinished uploads; unavailable safety checks reject privately. Invited journal/event/album projections exclude drafts and unrelated private events, and rotation removes access.

The real ClamAV adapter accepted a synthetic PNG and rejected the harmless standard antivirus test signature. TCP protocol fixture tests separately cover framing, infection and scanner error responses; they are not presented as live provider evidence.

Browser journey: created a two-file event/album grant; opened the account-free memories page; transferred actual PNG bytes; saw explicit unavailable-safety rejection; enabled the actual private scanner; transferred again and saw processed/pending approval, with the exhausted limit disabling upload. Public derivative returned 404 before owner approval, then 200 image/webp after approval in the already-published album. No original was exposed.

Inspected 1440px desktop and 360/366px mobile captures; 360px document width equalled viewport. Finish review identified live announcements and progress naming; fixed with change-only polite status announcements and labelled progress. Final fix review is recorded in design/guest-uploads-ui.md.

Build and typecheck passed in all nine packages, and lint passed after the final fixes. Full physical mobile video/camera, production scanner load and signature freshness monitoring remain R3 release checks. No production data, real email or paid AI traffic was used.
