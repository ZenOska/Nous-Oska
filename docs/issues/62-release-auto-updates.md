# Issue #62: Phase 9 : Release - Auto Updates

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, main-process, phase-9`

---

## Overview

Implement secure auto-update infrastructure with electron-updater, differential delta packages, update channels (stable, beta), and user update prompts.

---

## Scope & Boundaries

### In Scope

- Auto-update checking on application startup and periodic intervals.
- Update notification banner prompting user to restart to apply update.
- Cryptographic signature verification before executing downloaded update payloads.
- Configurable update channels (Stable vs Beta) in settings.

### Out of Scope

- Self-hosted enterprise update servers (GitHub Releases used).

---

## Acceptance Criteria (Definition of Done)

- [ ] Browser automatically checks GitHub Releases for new published versions.
- [ ] Updates download in background and prompt user when ready.
- [ ] Signature verification rejects modified or corrupted update payloads.
- [ ] Unit tests verify update lifecycle states and IPC dispatch.
