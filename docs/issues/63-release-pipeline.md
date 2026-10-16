# Issue #63: Phase 9 : Release - Pipeline

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, phase-9`

---

## Overview

Establish automated GitHub Actions production release workflow triggering upon Git version tags, running test matrices, compiling binaries, and publishing GitHub Releases.

---

## Scope & Boundaries

### In Scope

- Tag-triggered release workflow (`v*.*.*`).
- Parallel multi-platform compilation matrix (Windows, macOS, Linux).
- Automated CHANGELOG.md generation using conventional commit metadata.
- GitHub Release creation with uploaded binaries, SHA-256 checksums, and release notes.

### Out of Scope

- Canary nightly builds (Phase 9 follow-up).

---

## Acceptance Criteria (Definition of Done)

- [ ] Pushing a version tag triggers end-to-end automated build across all OS targets.
- [ ] Release draft is created with all installer binaries and checksum files attached.
- [ ] Changelog reflects all merged features and fixes cleanly.
- [ ] Full CI release pipeline documented in /docs/development/release-pipeline.md.
