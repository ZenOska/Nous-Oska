# Issue #35: Phase 4 : UX - Context Menus

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 4: Modern UX & Customization
- **Labels**: `enhancement, main-process, renderer, phase-4`

---

## Overview

Implement custom context menus for web content, link targets, images, selected text, and tab headers.

---

## Scope & Boundaries

### In Scope

- Contextual menu builder detecting right-clicked element type.
- Link actions (Open in New Tab, Copy Link Address, Open in Incognito).
- Image actions (Copy Image, Save Image As, Open Image in New Tab).
- Text selection actions (Copy, Search with Default Engine, Inspect Element).

### Out of Scope

- Extension context menu injection (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Right-clicking web elements displays relevant, styled context menus.
- [ ] Selecting menu actions executes expected operations immediately.
- [ ] Tab header context menu offers Reload, Duplicate, Close Other Tabs.
- [ ] Unit tests verify context menu generation matrix.
