# Issue #60: Phase 9 : Release - macOS

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, phase-9`

---

## Overview

Build universal macOS binaries (Apple Silicon + Intel), configure styled DMG installer, and implement Apple Developer code signing and notarization.

---

## Scope & Boundaries

### In Scope

- Universal macOS binary packaging (arm64 + x64).
- Styled DMG installer with application drag-to-Applications layout.
- Apple Developer ID code signing and `notarytool` notarization pipeline.
- macOS app bundle metadata (`Info.plist`), retina icons (.icns), and permissions.

### Out of Scope

- Mac App Store sandboxing (Distributed outside App Store).

---

## Acceptance Criteria (Definition of Done)

- [ ] DMG mounts cleanly with custom background and application icon alignment.
- [ ] Application is fully notarized and passes Gatekeeper checks without security warnings.
- [ ] Native macOS window controls and menu bar integrate correctly.
- [ ] Automated build produces valid notarized DMG on macOS CI runners.
