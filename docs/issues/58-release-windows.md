# Issue #58: Phase 9 : Release - Windows

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, phase-9`

---

## Overview

Configure production Windows distribution packaging, including NSIS installer, portable executable, desktop/start menu shortcuts, and code signing.

---

## Scope & Boundaries

### In Scope

- NSIS installer configuration in electron-builder (one-click, custom path).
- Standalone portable zip/exe package.
- Windows application icon (.ico) multi-resolution asset packaging.
- SignTool code signing integration with EV/standard certificate.

### Out of Scope

- Microsoft Store submission (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] NSIS installer installs cleanly and registers Windows shortcuts.
- [ ] Portable executable runs without administrative elevation.
- [ ] Uninstaller cleanly removes application files and shortcuts.
- [ ] Installer builds successfully in automated CI release workflow.
