# Issue #11: Phase 1 : Browser Shell - Page Reload, Cache Bypass & Stop Navigation

- **State**: OPEN
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, main-process, phase-1, mvp`

---

## Overview

Implement page Reload, Hard Reload (cache bypass), and Stop loading mechanisms for Phase 1 of the Nous desktop browser shell. This issue establishes the refresh controls required to reload active web content, bypass local caching mechanisms during network debugging, and abort pending requests.

---

## Scope & Boundaries

### In Scope

- **Reload & Hard Reload Controllers (`src/main/navigation/reload.ts`, `src/renderer/navigation/`)**:
  - Standard reload execution via `webContents.reload()`.
  - Cache-bypassing hard reload via `webContents.reloadIgnoringCache()`.
  - Abort loading in flight via `webContents.stop()`.
- **Dynamic Toolbar Button State Machine**:
  - Dual-state toolbar control: displays the **Reload** icon during idle states, and switches to a **Stop** (cancel) icon while a page is actively loading.
  - Clicking the control while loading aborts navigation and reverts icon to Reload.
- **Keyboard Shortcut Matrix**:
  - Standard Reload: `Ctrl+R`, `F5` (Windows/Linux), `Cmd+R` (macOS).
  - Hard Reload: `Ctrl+Shift+R`, `Ctrl+F5` (Windows/Linux), `Cmd+Shift+R` (macOS).
  - Stop Loading: `Escape` key while page is loading.

### Out of Scope (Deferred to Future Issues)

- Granular cache partition clearing and cookie eviction (Phase 5 ΓÇö Privacy & Security).
- Automatic periodic reload / tab sleep recovery (Phase 6 ΓÇö Advanced Browser).

---

## Technical Specifications

### Button State Machine

```
Idle State
  -> User navigates / clicks Reload
  -> Event `did-start-loading`
  -> UI icon switches to 'Stop' (Cross icon)
  -> User clicks Stop -> calls `navigation:stop`
       OR
  -> Event `did-finish-load` / `did-fail-load`
  -> UI icon reverts to 'Reload' (Circular arrow icon)
```

### IPC Contracts

```typescript
// Renderer -> Main
interface ReloadOptions {
  tabId: string;
  ignoreCache?: boolean;
}
```

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking the Reload button reloads the current page content.
- [ ] While a page is loading, the Reload button transforms into a Stop button that successfully halts the request upon click.
- [ ] Pressing `Ctrl+R` or `F5` triggers a standard reload.
- [ ] Pressing `Ctrl+Shift+R` or `Cmd+Shift+R` triggers a hard reload that bypasses local browser cache.
- [ ] Pressing `Escape` while a page is loading halts the network request and updates UI state.
- [ ] Unit tests verify IPC dispatch across standard, hard reload, and stop operations.
