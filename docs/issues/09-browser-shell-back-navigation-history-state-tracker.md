# Issue #9: Phase 1 : Browser Shell - Back Navigation & History State Tracker

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, main-process, phase-1, mvp`

---

## Overview

Implement Back Navigation and session history stack tracking for Phase 1 of the Nous desktop browser shell. This issue establishes the mechanics for traversing previously visited web pages within an active navigation context, while synchronizing toolbar button enablement states in real time.

---

## Scope & Boundaries

### In Scope

- **Back Navigation Controller (`src/main/navigation/history.ts`, `src/renderer/navigation/`)**:
  - Main process integration with `webContents.canGoBack()` and `webContents.goBack()`.
  - IPC channel `navigation:goBack` invoked when the toolbar Back button is triggered.
- **Dynamic State Synchronization**:
  - Broadcast navigation entry updates to the renderer on `did-navigate` and `did-navigate-in-page`.
  - Maintain the disabled/enabled visual state of the Back button in the browser toolbar ($O(1)$ button state toggle).
- **Keyboard Shortcut Integration**:
  - Global navigation shortcuts: `Alt+Left Arrow` (Windows/Linux) and `Cmd+[` (macOS), alongside mouse Back button (button 3/4) support.
- **Stack Integrity**:
  - Prevent illegal stack pops when the user is at the initial page (`canGoBack === false`).

### Out of Scope (Deferred to Future Issues)

- Forward navigation stack re-traversal (Issue #10).
- Persistent historical database with search, timestamps, and visit counts (Phase 3 ΓÇö Browser Data).
- History menu dropdown on long-press (Phase 4 ΓÇö UX).

---

## Technical Specifications

### IPC Interface

```typescript
// Renderer -> Main
interface NavigationHistoryAction {
  tabId: string;
}

// Main -> Renderer
interface NavigationCapabilities {
  canGoBack: boolean;
  canGoForward: boolean;
}
```

### Event Flow

```
User clicks Back / presses Alt+Left
  -> Renderer sends `navigation:goBack`
  -> Main process verifies `webContents.canGoBack()`
  -> `webContents.goBack()` executed
  -> `did-navigate` fires
  -> Main sends updated `canGoBack` capability
  -> Renderer updates toolbar button UI state
```

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking the Back button navigates to the preceding URL in the session history.
- [ ] Back button is visually disabled (`disabled` attribute and muted opacity) when no previous history exists.
- [ ] Back button becomes enabled as soon as the user navigates from the initial page to a new URL.
- [ ] Pressing `Alt+Left Arrow` or `Cmd+[` executes back navigation reliably.
- [ ] In-page anchor hash navigations (`#section`) are tracked and traversable via back navigation.
- [ ] Unit tests verify IPC dispatch and button state binding.
