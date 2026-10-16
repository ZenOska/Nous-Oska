# Issue #36: Phase 4 : UX - Customization

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 4: Modern UX & Customization
- **Labels**: `enhancement, renderer, phase-4`

---

## Overview

Provide user interface customization controls, including collapsible sidebar, toolbar button reordering, compact tab mode, and zoom controls.

---

## Scope & Boundaries

### In Scope

- Toolbar customization (toggle Home button, Bookmarks button, Extensions icon).
- Compact density mode for smaller laptop screens.
- Page zoom controls (zoom in, zoom out, reset zoom, remember per-host zoom).
- Full-screen mode (`F11`) with auto-hiding navigation chrome.

### Out of Scope

- Arbitrary drag-and-drop toolbar construction (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Users can toggle toolbar button visibility in settings.
- [ ] Page zoom scales content cleanly and persists per origin.
- [ ] Full-screen mode toggles smoothly via F11 or menu.
- [ ] Unit tests verify zoom calculations and layout toggles.
