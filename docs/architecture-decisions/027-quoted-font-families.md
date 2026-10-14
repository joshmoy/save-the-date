# 027 — Quote curated font families and preserve line metrics

2026-10-14. I03/I04.

Actual Chrome inspection found that bare CSS font-family Source Serif 4 is invalid because its name includes a numeric token. The preview inherited Work Sans from the card instead. New resolved designs use renderer version3, quote font-family values and give Source Serif4 line-height1.4: measured ink overflow was55px in a53px line box at42px. The corrected two-line preview measures118px client/scroll height with the intended face. Version1/2 snapshots retain their previous font serialization and leading; completed files remain immutable.

Verification: three focused font tests pass, zero skips. One actual PDF proves distinct SourceSerif4 and WorkSans font embedding; the other checks cover pinned assets and ambient typography pixel parity. The existing dedicated renderer was reused throughout; no full-family export matrix or complete suite ran. Templates build, focused lint and web production build pass.

Actual rebuilt Chrome preview at configured360×800: Source Serif4 names, Work Sans body,58.8px name line height, max-width none, no text overflow; document/body widths both345px with reserved scrollbar. Final screenshot browser-pagination/work-sans-preview-mobile.png supersedes the earlier pre-isolation screenshot. Viewport reset and tab closed. Physical-phone and updated Linux gates remain pending.
