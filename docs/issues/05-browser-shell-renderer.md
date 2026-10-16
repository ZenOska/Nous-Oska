# Issue #5: Phase 1 : Browser Shell - Renderer

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, phase-1, mvp`

---

## Overview

Implement the core renderer process architecture for the Phase 1 browser shell. The renderer serves as the presentation tier for the browser UI, executing in an untrusted sandbox and communicating with the privileged main process strictly across a secured IPC bridge.

---

## Scope & Boundaries

### In Scope

- **Renderer Process Foundation**: Establish a modular TypeScript architecture for DOM bootstrapping, window chrome controls, and view-state coordination.
- **IPC Client Layer**: Wrap the preload `contextBridge` (`window.electronAPI`) in a typed, resilient client that handles window controls, telemetry, and external delegations.
- **Context Isolation & Security Auditing**: Implement runtime security verification ensuring Node.js primitives (`require`, `process`, `Buffer`) do not leak into the renderer scope, and enforce protocol sanitization for address inputs.
- **Build Pipeline Integration**: Configure `tsconfig.renderer.json` and build scripts to cleanly emit compiled ES modules to `dist/renderer` alongside static HTML/CSS assets.
- **Unit Testing & Documentation**: Comprehensive test coverage via Vitest and component architecture documentation in `docs/components/renderer.md`.

### Out of Scope (Deferred to Future Issues)

- **Preload API Expansion** (Issue #6): Extending the underlying `contextBridge` exposure contracts.
- **Address Bar Controller & UI Validation** (Issue #7): Full address bar autocomplete, validation popups, and dedicated navigation events.
- **URL Navigation Pipeline** (Issue #8): Multi-scheme request routing, session partitioning, and error page rendering.
- **History & Navigation Stacks** (Issues #9, #10, #11): Back, forward, and cache-bypassing reload mechanics.
- **Advanced Tab Management** (Issue #12 & Phase 2): Multi-process `webContents` tab isolation, tab dragging, and session restoration.

---

## Technical Requirements

### 1. Architecture & Modularization (`src/renderer/`)

- Deconstruct the initial monolithic entry point into focused subsystems:
  - `src/renderer/app.ts`: Core application coordinator (`BrowserApp`) managing lifecycle, shortcut bindings, and element wiring.
  - `src/renderer/ipc/`: Typed IPC client abstraction (`RendererIpcClient`).
  - `src/renderer/security/`: Runtime isolation audit and input sanitization (`auditRendererContext`, `sanitizeNavigationUrl`).
  - `src/renderer/window/`: Window chrome controls and state synchronization (`WindowControls`).
  - `src/renderer/tabs/`: In-memory view state and tab lifecycle observer (`TabManager`).
  - `src/renderer/index.ts`: Application bootstrap on `DOMContentLoaded` and public module exports.

### 2. IPC Communication Boundary

- Connect renderer controls directly to exposed main-process handlers:
  - App metadata: `app:getVersion`, `app:getName`.
  - Platform query: `platform:get`.
  - External URL delegation: `shell:openExternal` (constrained to `http:`, `https:`, `mailto:`).
  - Window state & geometry: `window:minimize`, `window:maximize`, `window:unmaximize`, `window:toggleMaximize`, `window:close`, `window:isMaximized`, `window:getState`.
- Ensure graceful degradation when running in non-Electron or mock testing environments.

### 3. Context Isolation & Security Guarantees

- Verify that `contextIsolation: true` and `nodeIntegration: false` remain active at runtime.
- Intercept and block executable or dangerous URL schemes (`javascript:`, `data:`, `file:`) prior to dispatch.
- Ensure strict CSP compatibility (no inline eval or unhashed inline scripts).

### 4. Build & Tooling

- Update `tsconfig.renderer.json` to enable composite compilation (`noEmit: false`, `module: "NodeNext"`) into `dist/renderer`.
- Register renderer compilation in `tsconfig.build.json`.
- Configure `scripts/copy-renderer.js` to transfer static assets (`index.html`, `styles.css`) while excluding raw TypeScript sources.

---

## Acceptance Criteria (Definition of Done)

- [x] **Typecheck**: `pnpm typecheck` (`tsc --noEmit`) passes with zero diagnostics across all project targets.
- [x] **Lint & Format**: `pnpm lint` passes cleanly under ESLint and Prettier rules.
- [x] **Unit Tests**: Full Vitest suite passes (`pnpm test`), covering:
  - IPC client method delegation and missing-bridge error handling.
  - Runtime context isolation verification and scheme sanitization.
  - Tab manager lifecycle (creation, activation, updates, teardown).
  - Window controls event dispatch and maximize state sync.
- [x] **Build Validation**: `pnpm build` compiles ES modules and distributes static assets to `dist/renderer` ready for Electron execution.
- [x] **Documentation**:
  - `docs/components/renderer.md` created with architecture diagram, Big-O complexity, and security invariants.
  - `docs/architecture/renderer.md` updated to reflect the implemented structure.
