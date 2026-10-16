# Issue #24: Phase 2 : Tab System - Favicons

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 2: Tab System (MVP)
- **Labels**: `enhancement, renderer, phase-2, mvp`

---

## Overview

Implement favicon resolution, retrieval, caching, and rendering for tabs in the Nous desktop browser shell, replacing placeholders with high-fidelity site icons.

---

## Scope & Boundaries

### In Scope

- Listen to page-favicon-updated events and extract <link rel="icon"> references.
- Fallback favicon resolver using domain defaults and local SVG placeholders.
- Client-side favicon cache minimizing redundant network downloads.
- Visual display of 16x16 favicon in tab headers and bookmarks.

### Out of Scope

- Custom uploaded tab icons (Phase 4).

---

## Acceptance Criteria (Definition of Done)

- [ ] Tabs display the remote website favicon upon successful page load.
- [ ] High-contrast fallback icons display when sites lack favicons or are offline.
- [ ] Favicon cache reuses loaded assets across matching domains.
- [ ] Unit tests verify favicon parsing and fallback resolution.
