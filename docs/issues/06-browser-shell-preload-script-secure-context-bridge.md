# Issue #6: Phase 1 : Browser Shell - Preload Script & Secure Context Bridge

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, security, preload, phase-1, mvp`

---

## Overview

Implement the dedicated preload script layer and context bridge infrastructure for the Phase 1 browser shell. The preload script serves as the security boundary between Electron's privileged Node.js main process and the untrusted Chromium renderer world.

---

## Scope & Boundaries

### In Scope

- **Secure Context Bridge (`src/preload/index.ts`, `src/preload/api.ts`)**: Expose strictly typed, frozen API surfaces via Electron's `contextBridge.exposeInMainWorld('electronAPI', ...)`.
- **API Surface Definition**: Provide explicit channels for:
  - Application metadata (`app:getVersion`, `app:getName`).
  - Platform detection (`platform:get`).
  - External navigation delegation (`shell:openExternal`).
  - Window state controls (`window:minimize`, `window:maximize`, `window:unmaximize`, `window:toggleMaximize`, `window:close`, `window:isMaximized`, `window:getState`).
- **Sandboxing & Isolation Guarantees**: Enforce that neither `ipcRenderer` nor arbitrary `send`/`invoke` methods are exposed directly. Validate arguments before crossing the boundary.
- **Deep Freezing**: Freeze exposed API namespaces to prevent prototype pollution or tampering from renderer scripts.
- **Type Definitions (`src/renderer/globals.d.ts`)**: Maintain synchronous global TypeScript interface declarations for `Window.electronAPI`.
- **Automated Testing & Documentation**: Unit test IPC channel exposure and argument validation, and document the preload security architecture in `docs/components/preload.md`.

### Out of Scope

- Renderer UI consumption (completed in #5).
- Main process window lifecycle orchestration (completed in #4).
- Address bar and tab navigation controllers (Issues #7 - #12).

---

## Acceptance Criteria (Definition of Done)

- [x] Preload script compiles cleanly under `tsconfig.preload.json` with composite declarations emitted to `dist/preload/index.js`.
- [x] `contextBridge.exposeInMainWorld` is strictly used without leaking raw Node/Electron primitives.
- [x] Pre-flight validation on external URLs drops malicious pseudoprotocols (`javascript:`, `data:`, `file:`).
- [x] Unit tests verify exposed API structure, channel invocations, and error boundaries (`tests/unit/preload.test.ts`).
- [x] `docs/components/preload.md` documents the security boundary, exposed contracts, and threat model.
- [x] All automated validation checks (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) pass cleanly.
