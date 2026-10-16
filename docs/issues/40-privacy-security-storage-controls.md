# Issue #40: Phase 5 : Privacy & Security - Storage Controls

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, main-process, phase-5`

---

## Overview

Implement site storage inspection and quota controls for IndexedDB, LocalStorage, CacheStorage, and Service Workers.

---

## Scope & Boundaries

### In Scope

- Storage breakdown per visited origin (disk bytes used).
- One-click "Clear site data" from address bar security badge.
- Automated cache pruning preventing unbound disk growth.
- Service worker lifecycle monitoring and unregistration.

### Out of Scope

- Cloud storage backup (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Site storage dashboard accurately reports disk utilization.
- [ ] Clearing site data purges IndexedDB and LocalStorage completely.
- [ ] Unit tests verify storage eviction and cleanup operations.
