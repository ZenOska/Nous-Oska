# Issue #59: Phase 9 : Release - Linux

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, phase-9`

---

## Overview

Build and package production Linux distribution bundles including universal AppImage, Debian (.deb), and Red Hat (.rpm) packages.

---

## Scope & Boundaries

### In Scope

- AppImage packaging with integrated runtime dependencies and desktop entry.
- Debian package (.deb) targeting Ubuntu/Debian distributions.
- RPM package (.rpm) targeting Fedora/RHEL/openSUSE.
- Linux desktop file (.desktop) and multi-size PNG/SVG icons.

### Out of Scope

- Snap / Flatpak packaging (Deferred to Phase 9 follow-up).

---

## Acceptance Criteria (Definition of Done)

- [ ] AppImage executes reliably across modern Linux distributions without sandboxing issues.
- [ ] .deb and .rpm packages install and register with system package managers.
- [ ] Application correctly sets WM_CLASS and desktop launcher icon.
- [ ] Automated Linux build artifacts emitted in CI release pipeline.
