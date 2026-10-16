# Issue #21: Phase 2 : Tab System - Tab Switching

- **State**: OPEN
- **Milestone**: Phase 2: Tab System (MVP)
- **Labels**: `enhancement, renderer, phase-2, mvp`

---

## Overview

Implement instantaneous, flicker-free tab switching mechanics between open browser tabs, swapping active viewports, restoring address bar state, and updating navigation capability buttons in $O(1)$ constant time.

## Scope & Boundaries

### In Scope

- Reactive active tab pointer switching in `TabManager`.
- Viewport activation and detachment on tab change.
- Address bar URL and title restoration matching the focused tab.
- Toolbar Back/Forward enablement synchronization for the activated tab.

### Out of Scope

- 3D/Tab overview grid (Phase 4).

## Acceptance Criteria

- [ ] Clicking any tab header immediately activates and focuses that tab.
- [ ] Address bar and navigation controls reflect the newly focused tab's state.
- [ ] Switching occurs smoothly without page reloads or UI stutter.
- [ ] Unit tests verify active tab pointer updates and state synchronization.
