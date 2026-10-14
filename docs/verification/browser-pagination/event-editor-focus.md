# Event editor reachability — 2026-10-14

Actual Chrome extension interaction against the isolated `std_navigation_*_test` fixture, with email/AI disabled. No existing wedding data was changed.

Before: clicking the 50th displayed event's “Edit details” left focus on that button and the editor heading at −8,263 CSS pixels, outside the 861px viewport.

After: the editor's named heading receives focus and becomes visible (top413px at1512px width; top383px at360×800). Tab reaches the event-name input. Cancel closes the editor and returns focus to “Edit details for Synthetic celebration037.” Add event exposes expanded/controls state; submitting an empty new event focuses its required title field and shows native validation. Opening another wedding clears the previous editor. No horizontal overflow at either measured width.

Evidence: event-editor-focus-desktop.jpg and event-editor-focus-mobile.jpg. Build, lint and all nine type checks pass. This focused UI fix does not change API/domain behavior; the latest full regression remains145 tests/no skips from the preceding handover feature. This is scoped keyboard/viewport evidence, not physical touch or full WCAG conformance.
