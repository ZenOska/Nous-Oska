# Issue #23: Phase 2 : Tab System - Tab Titles

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 2: Tab System (MVP)
- **Labels**: `enhancement, renderer, phase-2, mvp`

---

## Overview

Implement real-time page title synchronization between active/background WebContents and tab headers, supporting truncated display, tooltips on hover, and window title updates.

---

## Scope & Boundaries

### In Scope

- Listen to page-title-updated lifecycle events across all open tabs.
- Dynamic tab header text updating with ellipsis overflow handling.
- Full title display via title attribute tooltips on hover.
- Main window title synchronization matching active tab (<Title> - Nous).

### Out of Scope

- Custom user tab renaming (Phase 4).

---

## Acceptance Criteria (Definition of Done)

- [ ] Tab headers update in real time when navigating to a new page.
- [ ] Overlong titles truncate cleanly without breaking tab bar layout.
- [ ] Window title dynamically mirrors active tab title.
- [ ] Unit tests verify title update events and formatting.
