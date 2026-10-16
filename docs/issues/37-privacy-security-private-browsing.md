# Issue #37: Phase 5 : Privacy & Security - Private Browsing

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, main-process, phase-5`

---

## Overview

Implement Private Browsing (Incognito) mode with isolated in-memory session partitions, preventing history, cookie, or cache persistence.

---

## Scope & Boundaries

### In Scope

- In-memory session partition (`session.fromPartition("incognito")`).
- Distinct visual chrome theme (deep violet/slate indicator badge).
- Zero disk persistence for history, downloads record, or cookies.
- Automatic cleanup of in-memory data when private window closes.

### Out of Scope

- Tor network routing (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Private window opens with independent, isolated session partition.
- [ ] No history or cookies from private windows leak into standard session.
- [ ] Closing private window completely purges temporary cache and cookies.
- [ ] Unit tests verify session isolation and data non-persistence.
