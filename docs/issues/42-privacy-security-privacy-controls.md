# Issue #42: Phase 5 : Privacy & Security - Privacy Controls

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, main-process, phase-5`

---

## Overview

Implement built-in tracking protection, Do Not Track / Global Privacy Control headers, and canvas fingerprinting mitigations.

---

## Scope & Boundaries

### In Scope

- Global Privacy Control (GPC) and DNT request header injection.
- Known tracking domain blocklist integrated into network request filter.
- Referrer trimming policy (strict-origin-when-cross-origin).
- Canvas and WebGL fingerprinting noise randomization.

### Out of Scope

- Full Tor-level anonymity network (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Outgoing HTTP requests include GPC=1 headers by default.
- [ ] Known tracking pixels and scripts are dropped at network layer.
- [ ] Privacy shield dashboard displays count of blocked trackers.
- [ ] Unit tests verify request filtering and header injection.
