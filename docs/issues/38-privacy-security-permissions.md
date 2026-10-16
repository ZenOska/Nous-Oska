# Issue #38: Phase 5 : Privacy & Security - Permissions

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, main-process, renderer, phase-5`

---

## Overview

Implement modern web permissions framework intercepting site requests for geolocation, camera, microphone, notifications, and clipboard access.

---

## Scope & Boundaries

### In Scope

- Intercept `session.setPermissionRequestHandler` across all webContents.
- Renderer permission modal dialog (Allow, Block, Remember).
- Site settings permission manager (view and revoke granted permissions).
- Address bar lock icon showing active permissions for the current host.

### Out of Scope

- USB/HID raw hardware permissions (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Websites cannot access camera, mic, or location without explicit user grant.
- [ ] User decisions persist per domain when Remember is selected.
- [ ] Revoking permission in settings takes effect immediately.
- [ ] Unit tests verify permission interception and policy persistence.
