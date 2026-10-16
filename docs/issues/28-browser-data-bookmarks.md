# Issue #28: Phase 3 : Browser Data - Bookmarks

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 3: Browser Data
- **Labels**: `enhancement, main-process, renderer, phase-3`

---

## Overview

Implement bookmark creation, hierarchical folder organization, bookmarks toolbar, and quick starring from the address bar.

---

## Scope & Boundaries

### In Scope

- Address bar star icon toggling bookmark state for the active URL.
- Hierarchical bookmark tree data structure (folders, items, order index).
- Bookmarks toolbar toggle and quick-click launch.
- Bookmark export/import in standard Netscape HTML format.

### Out of Scope

- Encrypted remote sync (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking the star icon toggles bookmark state and saves page metadata.
- [ ] Bookmarks bar renders user bookmarks and nested folders.
- [ ] HTML import and export correctly parse existing browser bookmarks.
- [ ] Unit tests verify bookmark tree mutations and serialization.
