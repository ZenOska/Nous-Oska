# Issue #39: Phase 5 : Privacy & Security - Cookies

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, main-process, phase-5`

---

## Overview

Implement granular cookie manager supporting third-party cookie blocking, cookie inspection, domain filtering, and clear-on-exit policies.

---

## Scope & Boundaries

### In Scope

- Third-party cookie blocking toggle in privacy settings.
- Domain cookie viewer showing name, value, expiration, secure flags.
- Clear cookies on browser exit toggle.
- Partitioned cookie storage enforcement.

### Out of Scope

- Cookie auto-consent banner rejector (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Third-party tracking cookies are blocked when enabled.
- [ ] Users can inspect and delete cookies for specific domains.
- [ ] Cookie policies enforce SameSite and Secure attributes.
- [ ] Unit tests verify cookie filtering and lifecycle rules.
