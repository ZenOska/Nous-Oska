# Issue #34: Phase 4 : UX - Themes

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 4: Modern UX & Customization
- **Labels**: `enhancement, renderer, phase-4`

---

## Overview

Implement dynamic theming engine supporting dark mode, light mode, system appearance synchronization, and custom accent color palettes.

---

## Scope & Boundaries

### In Scope

- CSS custom properties token system for all browser chrome surfaces.
- Native OS dark/light mode detection (`nativeTheme.shouldUseDarkColors`).
- Curated accent color choices (cyan, purple, emerald, rose, amber).
- Persistent theme selection applied before first paint.

### Out of Scope

- Third-party theme store (Phase 6).

---

## Acceptance Criteria (Definition of Done)

- [ ] Theme switching alters all UI elements instantaneously without reload.
- [ ] System mode changes dynamically update chrome when set to Auto.
- [ ] Zero theme flash or FOUC during browser startup.
- [ ] Unit tests verify CSS token switching and theme persistence.
