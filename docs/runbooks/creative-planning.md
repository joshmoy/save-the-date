# Creative planning

Use Concepts & planning to save context, create a manual concept and arrange owned photo/note tiles. Unknown dates and budgets stay unknown. Save a revision, have an owner approve it, review theme changes and apply to drafts. Publish the website separately. Export the approved planner PDF and JSON; per-format failures have individual retry controls.

Local operation needs the API, worker, private storage and rendering browser/fonts. AI remains disabled by default. For external verification configure `LLM_ADAPTER=openai`, `OPENAI_API_KEY`, `OPENAI_LLM_MODEL`, `OPENAI_API_URL`; image generation also needs `IMAGE_ADAPTER=openai` and `OPENAI_IMAGE_MODEL`. Configure reviewed `AI_CONCEPT_ESTIMATED_USD` / `AI_BOARD_ESTIMATED_USD` before paid use; daily limits/credits are listed in `.env.example`. Estimates are operator-supplied, not vendor quotations. Never run a paid smoke check without authorisation.

A failed provider/schema job releases allowance. An uncertain submission is not automatically retried: inspect metadata and reconcile with the provider before deciding on a fresh operation. Cancellation cannot recall an already submitted provider request. Missing provider settings leave core operations and manual work usable.

Evidence: `docs/verification/creative/report.md`. Fixture adapter coverage proves application behaviour, not actual model quality or feasibility. Live provider evaluation remains outstanding.
