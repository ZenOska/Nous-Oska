# Issue #30: Phase 3 : Browser Data - Sessions

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 3: Browser Data
- **Labels**: `enhancement, main-process, phase-3`

---

## Overview

Implement session persistence and restoration, enabling seamless state recovery on browser restart or accidental application crash.

---

## Scope & Boundaries

### In Scope

- Debounced session state serialization (open tabs, active index, URLs, scroll positions).
- Crash detection flag and "Restore session" prompt upon restart.
- Configurable startup action (restore previous session vs new tab page).
- Safe fallback when restoring unresponsive or crashed URLs.

### Out of Scope

- Cross-device session handoff (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Quitting and restarting browser restores exact tab set when configured.
- [ ] Crashed sessions offer user-friendly recovery prompt.
- [ ] Session storage operates with zero impact on UI responsiveness.
- [ ] Unit tests verify state serialization and restoration edge cases.
