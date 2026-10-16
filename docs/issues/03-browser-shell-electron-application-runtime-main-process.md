# Issue #3: Phase 1 : Browser Shell - Electron Application Runtime & Main Process

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, good first issue, help wanted, main-process, phase-1, mvp`

---

## Overview

Establish the foundational Electron application runtime and main process entry point for Phase 1 of the Nous desktop browser shell. This issue encompasses the base application lifecycle, single-instance process synchronization, graceful shutdown sequences, and cross-platform build configurations.

---

## Scope & Boundaries

### In Scope

- **Main Process Bootstrap (`src/main/index.ts`)**: Application initialization on `app.whenReady()`, lifecycle coordination, and cross-platform signal handling.
- **Single-Instance Enforcement**: Request single-instance lock (`app.requestSingleInstanceLock()`) to prevent duplicate instances and focus existing window upon second-instance launch.
- **Graceful Lifecycle Handlers**: Proper window management across platforms, including macOS activation (`activate` event when no windows exist) and clean termination (`window-all-closed`).
- **Security & Unhandled Exceptions**: Global handlers for `uncaughtException` and `unhandledRejection` with structured logging.
- **Build & Packaging Foundation**: Multi-target TypeScript compilation (`tsconfig.main.json`) and `electron-builder` configuration in `package.json` for Windows, macOS, and Linux targets.

### Out of Scope (Deferred to Dedicated Issues)

- Specific window geometry and visual styling (Issue #4).
- Secure preload context bridge implementation (Issue #6).
- Renderer process UI and DOM bootstrapping (Issue #5).
- Web content navigation and multi-tab controllers (Issues #7 - #12).

---

## Technical Specifications

1. **Process Lifecycle**:
   - `app.whenReady()` triggers initialization of core subsystems.
   - `window-all-closed`: Terminate application on Windows/Linux; preserve background process on macOS (`process.platform !== 'darwin'`).
   - `second-instance`: Restore and focus the primary window if an additional process attempts to launch.
2. **Tooling & Build System**:
   - Configure composite TypeScript compilation targets (`tsconfig.main.json`, `tsconfig.build.json`) emitting to `dist/main`.
   - Asset distribution scripts (`scripts/copy-renderer.js`) integrated into the build pipeline.
   - Define cross-platform packaging matrix (Windows NSIS/portable, macOS DMG/ZIP, Linux AppImage/deb/rpm).

---

## Acceptance Criteria (Definition of Done)

- [x] Application successfully bootstraps via `pnpm dev` and `pnpm start`.
- [x] Single-instance lock correctly detects and prevents concurrent processes.
- [x] Application terminates cleanly without dangling background processes when all windows are closed (except macOS).
- [x] TypeScript builds compile with zero diagnostics under strict settings (`tsc --build`).
- [x] Unit test suite and CI validation execute and pass with 100% success rate.
