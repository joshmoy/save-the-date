# Runtime dependency minimisation

Use a pinned official Node22 Debian13 runtime and apply available OS updates. Remove unused npm/Corepack runtime tooling; execute migration scripts through Node/tsx. Keep the independently selectable, previously verified pinned Node22 build stage. Both stages exclude secrets through .dockerignore; builders are disposable and never receive production credentials.

A Debian13 build-stage install with a new cache mount hung and was confirmed canceled by BuildKit. Reusing the existing pinned build stage restored a reproducible build; the runtime upgrade remained intact. Linux processing/exports and capture-only compose journeys pass. This is a tested build/runtime pair, not universal native-ABI compatibility.

The runtime scan improved substantially but retains1 critical/219 high findings without reported fixed stable versions. Preserve full reports and production risk review; a zero npm registry audit is not an OS security guarantee. Do not deploy publicly or claim complete R3 based on this decision.
