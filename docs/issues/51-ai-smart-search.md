# Issue #51: Phase 7 : AI - Smart Search

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 7: AI & Semantic Intelligence
- **Labels**: `enhancement, renderer, phase-7`

---

## Overview

Implement semantic smart search in the address bar and page finder, enabling natural language queries across open tabs, bookmarks, and visited history.

---

## Scope & Boundaries

### In Scope

- Vector/semantic embedding pipeline for recent history and bookmarks.
- Natural language query parsing in address bar ("that rust article I read yesterday").
- Fuzzy and semantic result ranking with confidence scores.
- Instant keyboard navigation and preview of matched results.

### Out of Scope

- Cloud semantic indexing (Privacy-first: 100% on-device).

---

## Acceptance Criteria (Definition of Done)

- [ ] Natural language queries retrieve relevant pages without exact keyword matches.
- [ ] Semantic indexing runs in background with low CPU utilization.
- [ ] Search results display matching context snippet and visit date.
- [ ] Unit tests verify semantic ranking and search dispatch.
