# Issue #45: Phase 6 : Advanced Browser - Split View

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 6: Advanced Workspace & Productivity
- **Labels**: `enhancement, renderer, main-process, phase-6`

---

## Overview

Implement side-by-side dual pane split view allowing users to view and interact with two web pages concurrently within a single browser tab.

---

## Scope & Boundaries

### In Scope

- Split tab into side-by-side (50/50) or stacked (vertical) view.
- Adjustable splitter bar allowing custom pane width resizing.
- Independent navigation controls for active focused pane.
- Swap pane positions and unsplit back to individual tabs.

### Out of Scope

- Quad-view / 4 panes (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Users can split any tab with an adjacent tab or new URL.
- [ ] Both panes render and process user input concurrently.
- [ ] Resizing the splitter smoothly adjusts WebContentsView bounds.
- [ ] Unit tests verify split layout calculations and IPC resize events.
