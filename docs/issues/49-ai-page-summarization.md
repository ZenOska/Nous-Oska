# Issue #49: Phase 7 : AI - Page Summarization

- **State**: PLANNED / ROADMAP
- **Milestone**: Phase 7: AI & Semantic Intelligence
- **Labels**: `enhancement, renderer, phase-7`

---

## Overview

Implement one-click AI page summarization, distilling complex articles, research papers, and documentation into key bullet points and TL;DR summaries.

---

## Scope & Boundaries

### In Scope

- Extract main page text payload safely from active WebContents.
- Structured summarization prompt (Executive summary, Key points, Action items).
- Summary display card inside AI sidebar or overlay popover.
- Export summary to Markdown or clipboard.

### Out of Scope

- Multi-document synthesis (Deferred).

---

## Acceptance Criteria (Definition of Done)

- [ ] Clicking "Summarize" extracts article content and streams concise summary.
- [ ] Long pages are chunked intelligently within token budget limits.
- [ ] Summarization operates without blocking the browser UI thread.
- [ ] Unit tests verify text extraction and prompt formatting.
