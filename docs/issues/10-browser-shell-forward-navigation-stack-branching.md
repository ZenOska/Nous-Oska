# Issue #10: Phase 1 : Browser Shell - Forward Navigation & Stack Branching

- **State**: OPEN
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, main-process, phase-1, mvp`

---

## Overview

Implement Forward Navigation and forward-branching stack management for Phase 1 of the Nous desktop browser shell. This issue provides the mechanism to step forward into previously visited pages after backward navigation has occurred, and ensures forward history is correctly truncated when a new navigation branch is initiated.

---

## Scope & Boundaries

### In Scope

- **Forward Navigation Controller (`src/main/navigation/forward.ts`, `src/renderer/navigation/`)**:
  - Main process integration with `webContents.canGoForward()` and `webContents.goForward()`.
  - IPC channel `navigation:goForward` wired to the toolbar Forward button.
- **Branch Truncation Guarantee**:
  - Ensure forward history entries are discarded when the user enters a new destination URL after traversing backward.
- **UI State Synchronization**:
  - Forward button remains disabled by default on new pages or when at the head of the navigation stack.
  - Enabled automatically when a backward navigation creates forward history entries.
- **Keyboard Shortcut Integration**:
  - Global navigation shortcuts: `Alt+Right Arrow` (Windows/Linux) and `Cmd+]` (macOS), alongside mouse Forward button (button 4/5) support.

### Out of Scope (Deferred to Future Issues)

- Long-click history jump dropdown menu (Phase 4 ΓÇö UX).
- Persistent cross-session history index (Phase 3 ΓÇö Browser Data).

---

## Technical Specifications

### Forward Stack Branching Invariant

$$\text{Stack}: [A \to B \to C]$$
$$\text{Navigate Back}: \text{Current} = B, \; \text{Forward Stack} = [C]$$
$$\text{Case 1 (Forward)}: \text{Click Forward} \implies \text{Current} = C$$
$$\text{Case 2 (Branch)}: \text{Navigate to } D \implies \text{Stack} = [A \to B \to D], \; \text{Forward Stack} = \emptyset$$

### IPC Interface

```typescript
// Renderer -> Main
interface NavigationForwardAction {
  tabId: string;
}
```

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking the Forward button advances to the next entry in the active history stack.
- [ ] Forward button is disabled when at the newest entry in the session history.
- [ ] Forward button becomes active immediately upon navigating back from a subsequent page.
- [ ] Navigating to a new URL while viewing an older history entry clears the forward stack and disables the Forward button.
- [ ] Pressing `Alt+Right Arrow` or `Cmd+]` executes forward navigation reliably.
- [ ] Unit tests verify forward state transitions and stack branch invalidation.
