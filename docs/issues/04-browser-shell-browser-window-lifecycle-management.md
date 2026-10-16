# Issue #4: Phase 1 : Browser Shell - Browser Window & Lifecycle Management

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, main-process, phase-1, mvp`

---

## Overview

Implement the dedicated Browser Window management infrastructure for Phase 1 of the Nous desktop browser. This issue encapsulates Electron window instantiation, bounds constraints, frameless styling, webPreferences security boundaries, window lifecycle orchestration, and window control IPC dispatch.

---

## Scope & Boundaries

### In Scope

- **Window Architecture & Configuration (`src/main/window/config.ts`)**:
  - Initial dimensions of `1400x900` clamped to the primary display work area, with minimum dimensions of `800x600`.
  - Frameless modern styling (`titleBarStyle: 'hidden'`) with native dark background `#0d0f12` to eliminate white flash during initial rendering.
- **WebPreferences & Security Guarantees**:
  - Strict sandbox isolation: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
  - Interception and prevention of unsolicited child window popups via `setWindowOpenHandler`.
- **Window Lifecycle Management (`src/main/window/lifecycle.ts`)**:
  - Graceful display sequencing on `ready-to-show` event to prevent render flickering.
  - Runtime telemetry and crash recovery hooks (`unresponsive`, `responsive`, `render-process-gone`).
- **IPC Window Management (`src/main/window/manager.ts`)**:
  - Registration of `window:*` IPC handlers (`window:minimize`, `window:maximize`, `window:unmaximize`, `window:toggleMaximize`, `window:close`, `window:isMaximized`, `window:getState`).
- **Testing & Documentation**:
  - Unit test suite covering configuration calculations, lifecycle handlers, and manager registration.
  - Component architecture documentation in `docs/components/browser-window.md`.

### Out of Scope

- Renderer UI window control button elements (implemented in #5).
- Preload script bridge definition (implemented in #6).
- Navigation stacks and tab management (Issues #7 - #12).

---

## Technical Specifications

| Property / Event | Specification                                              | Purpose                                                         |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Dimensions       | `1400x900` default, `800x600` minimum                      | Ensures functional UI density across varied display resolutions |
| Style & Chrome   | `titleBarStyle: 'hidden'`, `backgroundColor: '#0d0f12'`    | Modern frameless window with custom application header          |
| IPC Handlers     | `window:minimize`, `window:maximize`, `window:close`, etc. | Securely controls window state from untrusted renderer          |
| Lifecycle        | `ready-to-show`, `render-process-gone`, `unresponsive`     | Eliminates visual flash and captures runtime stability metrics  |

---

## Acceptance Criteria (Definition of Done)

- [x] Main browser window initializes with verified dimensions and frameless styling.
- [x] Security policies strictly enforced in `webPreferences` without Node.js exposure.
- [x] Window control IPC handlers registered and functional via preload context bridge.
- [x] Vitest test suites in `tests/unit/` pass with 100% coverage for window modules.
- [x] `docs/components/browser-window.md` documents architectural contracts and Big-O bounds.
