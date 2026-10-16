# Issue #61: Phase 9 : Release - Installers

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 9: Production Distribution & Release
- **Labels**: `ci, phase-9`

---

## Overview

Standardize custom installer branding, default browser registration handlers, URL protocol associations (http, https), and file associations (html, htm).

---

## Scope & Boundaries

### In Scope

- Default browser prompt and registration (`app.setAsDefaultProtocolClient`).
- File association registration for .html, .htm, and .pdf files.
- Custom branded installer graphics, licensing agreement screens, and telemetry opt-in.
- Silent/unattended installation flags for enterprise deployments.

### Out of Scope

- Enterprise Active Directory Group Policy templates (Post-v1.0).

---

## Acceptance Criteria (Definition of Done)

- [ ] Application successfully prompts and registers as default system browser.
- [ ] Double-clicking HTML files opens them in Nous.
- [ ] Silent installer flags (`/S`, `-q`) execute without UI popups.
- [ ] Documentation covers installation switches in /docs/development/installers.md.
