# Issue #7: Phase 1 : Browser Shell - Address Bar Controller & Security Indicator

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, renderer, phase-1, mvp`

---

## Overview

Implement the interactive Address Bar subsystem for Phase 1 of the Nous desktop browser shell. The address bar coordinates destination input, security status indication, protocol validation, smart search routing, and navigation event dispatch between the user and active browser view contexts.

---

## Scope & Boundaries

### In Scope

- **Address Bar Controller (`src/renderer/address-bar/address-bar.ts`)**:
  - Focus and blur lifecycle management with automatic text selection on focus.
  - Keyboard shortcut bindings: `Enter` (commit navigation), `Escape` (revert edit & blur), `Ctrl+L` / `Cmd+L` (global focus).
  - Navigation event dispatch to registered view and tab listeners (`onNavigate`, `onRefresh`).
- **URL Validation & Smart Search Routing (`src/renderer/address-bar/validator.ts`)**:
  - Normalization of user inputs (trimming, handling empty strings as `about:blank`).
  - Security filtering blocking executable or dangerous schemes (`javascript:`, `data:`, `file:`, `vbscript:`).
  - Smart heuristic routing: local destinations (`localhost`, IPv4) default to `http://`, valid domains default to `https://`, and search queries default to Google (`https://www.google.com/search?q=`).
- **Display & Security Formatting (`src/renderer/address-bar/formatter.ts`)**:
  - Visual security state management: HTTPS padlock, HTTP warning badge, internal `about:` pill, and invalid scheme error highlights.
  - Decoupled display format (clean host/path on blur) versus raw URL format (editable on focus).
- **Unit Testing & Documentation**:
  - Dedicated Vitest test suites (`tests/unit/address-bar.test.ts`, `tests/unit/address-bar-validator.test.ts`, `tests/unit/address-bar-formatter.test.ts`).
  - Component architecture documentation in `docs/components/address-bar.md`.

### Out of Scope (Deferred to Future Issues)

- Main process webContents network request loading (Issue #8).
- History stack back/forward traversal (Issues #9, #10).
- Auto-complete search suggestion popups and bookmark matching (Phase 3 & Phase 4).

---

## Technical Specifications

| Component          | Responsibility                                          | Performance Target               |
| ------------------ | ------------------------------------------------------- | -------------------------------- |
| `AddressBar`       | DOM orchestration, keyboard bindings, event emitter     | $O(1)$ state transitions         |
| `AddressValidator` | Scheme checking, regex host parsing, search fallback    | $O(L)$ where $L$ is input length |
| `AddressFormatter` | Protocol stripping for display, security classification | $O(L)$ string slicing            |

### Security Invariants

1. **Execution Prevention**: Script URLs (`javascript:...`) are strictly rejected and visually flagged with an error state.
2. **Protocol Integrity**: Insecure HTTP destinations trigger warning badges; HTTPS triggers secure badges.
3. **Display Decoupling**: Editable text is fully exposed on focus, but simplified on blur for cognitive clarity.

---

## Acceptance Criteria (Definition of Done)

- [ ] Typing a valid URL (with or without protocol) formats and navigates to the target destination upon pressing `Enter`.
- [ ] Entering raw search terms routes seamlessly to the search engine URL.
- [ ] Insecure or blocked protocols (`javascript:`, `data:`) trigger visual error feedback without executing.
- [ ] `Escape` cancels edits and restores current active page URL.
- [ ] `Ctrl+L` / `Cmd+L` focuses the address bar and highlights current input.
- [ ] Unit tests pass with 100% test coverage across validator, formatter, and controller modules.
- [ ] Component architecture documented in `docs/components/address-bar.md`.
