# Issue #32: Phase 4 : UX - New Tab Page

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 4: Modern UX & Customization
- **Labels**: `enhancement, renderer, phase-4`

---

## Overview

Design and implement an engaging, high-performance New Tab Page featuring search shortcuts, top sites speed dial, recent history chips, and customizable backdrop.

---

## Scope & Boundaries

### In Scope

- Central search input with instant search engine query redirection.
- Speed dial grid displaying user-pinned and most-visited sites.
- Recent tabs and downloads resume section.
- Clean dark/light theme aesthetic with customizable wallpapers.

### Out of Scope

- Sponsored advertising tiles (Nous is ad-free).

---

## Acceptance Criteria (Definition of Done)

- [ ] Opening a new tab loads the dashboard instantaneously (sub-16ms).
- [ ] Clicking quick links navigates directly within the active tab context.
- [ ] Users can add, remove, and reorder speed dial shortcuts.
- [ ] Unit tests verify speed dial storage and search bar dispatch.
