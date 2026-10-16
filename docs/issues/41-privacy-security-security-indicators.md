# Issue #41: Phase 5 : Privacy & Security - Security Indicators

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 5: Privacy & Security Hardening
- **Labels**: `enhancement, security, renderer, phase-5`

---

## Overview

Implement comprehensive security indicator system in the address bar displaying TLS/SSL certificate status, mixed content warnings, and insecure protocol alerts.

---

## Scope & Boundaries

### In Scope

- Certificate details modal (issuer, validity dates, cipher suite, SANs).
- Mixed content warning icon for pages loading HTTP assets over HTTPS.
- Prominent "Not Secure" warning for plain HTTP destinations.
- Strict Transport Security (HSTS) enforcement.

### Out of Scope

- Custom root CA manager (System trust store used).

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking address bar lock icon displays full certificate diagnostics.
- [ ] Mixed content displays visual warning without silent failure.
- [ ] Plain HTTP connections display high-contrast security badge.
- [ ] Unit tests verify certificate validation and badge state logic.
