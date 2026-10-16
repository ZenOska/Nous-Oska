# Issue #12: Phase 1 : Browser Shell - Tab Model, Lifecycle & View Isolation

- **State**: OPEN
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, main-process, phase-1, mvp`

---

## Overview

Implement New Tab instantiation, active tab switching, and independent navigation context isolation for Phase 1 of the Nous desktop browser shell. This issue establishes the fundamental multi-tab state model within the renderer chrome and coordinates view lifecycle events with the main process.

---

## Scope & Boundaries

### In Scope

- **Tab State Architecture (`src/renderer/tabs/tab-manager.ts`)**:
  - In-memory reactive tab model managing collections of discrete tab entities (`id`, `title`, `url`, `favicon`, `isLoading`, `historyState`).
  - Active tab pointer and selection mechanics ($O(1)$ switching).
- **Tab Lifecycle Actions**:
  - **New Tab Creation**: Triggered via the toolbar `+` button, global shortcut (`Ctrl+T` / `Cmd+T`), or browser window startup. Initializes default page (`about:blank` or start page).
  - **Tab Switching**: Clicking a tab header activates its corresponding view context, restores its address bar destination, and updates navigation button states.
  - **Tab Closure**: Closing via tab `x` button or `Ctrl+W` / `Cmd+W`. Graceful fallback ensuring an active tab is always preserved.
- **Context Isolation & Independent Histories**:
  - Guarantee that each tab instance maintains an independent navigation stack and document state without cross-tab state leakage.

### Out of Scope (Deferred to Future Issues)

- Visual tab dragging, reordering, and detaching into new windows (Phase 2 ΓÇö Tab System).
- Tab sleep/unloading for memory reduction (Phase 6 ΓÇö Advanced Browser).
- Tab groups, pinned tabs, and workspaces (Phase 6 ΓÇö Advanced Browser).

---

## Technical Specifications

### 1. Tab Entity Schema

```typescript
interface BrowserTab {
  readonly id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  createdAt: number;
}
```

### 2. Tab Lifecycle Rules

- **Initial State**: Window launch automatically boots Tab 1 (`about:blank`).
- **Closure Rule**: If the active tab is closed, focus transfers to the right adjacent tab; if closed at the right boundary, focus transfers to the left adjacent tab. If the final tab is closed, a new default tab is spawned.
- **Keyboard Shortcuts**:
  - `Ctrl+T` / `Cmd+T`: Create new tab.
  - `Ctrl+W` / `Cmd+W`: Close active tab.
  - `Ctrl+Tab` / `Ctrl+Shift+Tab`: Cycle through tabs sequentially.
  - `Ctrl+1` through `Ctrl+8`: Jump directly to tab index.

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking the `+` button in the tab bar creates and immediately focuses a new tab.
- [ ] Pressing `Ctrl+T` or `Cmd+T` spawns a new tab and focuses the address bar for quick navigation.
- [ ] Switching between tabs instantly swaps address bar contents and Back/Forward capabilities to match the selected tab.
- [ ] Clicking the close `x` icon or pressing `Ctrl+W` safely destroys the tab and preserves application stability.
- [ ] Each tab navigates independently without overwriting or interfering with peer tab histories.
- [ ] Unit test suite in `tests/unit/` validates tab manager creation, switching, and closure state invariants.
