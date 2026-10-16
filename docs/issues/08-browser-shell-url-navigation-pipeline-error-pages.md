# Issue #8: Phase 1 : Browser Shell - URL Navigation Pipeline & Error Pages

- **State**: CLOSED
- **Milestone**: Phase 1: Browser Shell (MVP)
- **Labels**: `enhancement, help wanted, security, main-process, phase-1, mvp`

---

## Overview

Implement the URL Navigation pipeline and WebContents request orchestration for Phase 1 of the Nous desktop browser. This issue establishes the communication bridge and main-process navigation handlers that load web destinations, manage navigation lifecycle events, and render structured error pages upon network or DNS failures.

---

## Scope & Boundaries

### In Scope

- **Navigation IPC Handlers (`src/main/navigation/`)**:
  - `navigation:loadUrl`: Validate and load formatted URLs within the active `webContents` instance.
  - `navigation:getState`: Query current loading state, active URL, and page title.
- **WebContents Lifecycle Monitoring**:
  - `did-start-loading`: Emit loading start signal to renderer chrome (triggers reload spinner).
  - `did-finish-load`: Emit completion signal, update page title, and synchronize final destination URL with address bar.
  - `did-fail-load`: Intercept HTTP/network errors (`ERR_INTERNET_DISCONNECTED`, `ERR_NAME_NOT_RESOLVED`, `ERR_CONNECTION_REFUSED`, `ERR_CERT_*`) and suppress raw crash dialogs.
- **Graceful Error Page Subsystem**:
  - Provide a clean, dark-themed built-in error page (`about:neterror`) displaying human-readable error diagnostics and a retry button.
- **Protocol Enforcement**:
  - Permitted network schemes: `https:`, `http:`, `about:`.
  - Block unhandled local or executable protocols.

### Out of Scope (Deferred to Future Issues)

- Tab-isolated multiple `webContents` management (Issue #12 & Phase 2).
- Historical navigation stack traversal (`canGoBack`, `canGoForward`) (Issues #9, #10).
- Ad-blocking and request filter pipelines (Phase 5).

---

## Technical Specifications

### 1. IPC Contracts

```typescript
// Renderer -> Main
interface NavigationRequest {
  tabId: string;
  url: string;
}

// Main -> Renderer
interface NavigationStateChange {
  tabId: string;
  isLoading: boolean;
  url: string;
  title: string;
  errorCode?: number;
  errorDescription?: string;
}
```

### 2. Error Recovery Matrix

| Error Code                           | Meaning                             | User Feedback                          |
| ------------------------------------ | ----------------------------------- | -------------------------------------- |
| `-105` (`ERR_NAME_NOT_RESOLVED`)     | DNS lookup failure                  | "Server IP address could not be found" |
| `-106` (`ERR_INTERNET_DISCONNECTED`) | No network connection               | "You are currently offline"            |
| `-102` (`ERR_CONNECTION_REFUSED`)    | Host actively refused connection    | "Site refused to connect"              |
| `-200` to `-299` (`ERR_CERT_*`)      | Certificate authority / SSL failure | Security warning screen with details   |

---

## Acceptance Criteria (Definition of Done)

- [ ] Typing a web address in the address bar triggers `navigation:loadUrl` and renders the target page.
- [ ] Browser window title updates dynamically to match the loaded page's `<title>`.
- [ ] Network failures (e.g. invalid domains, offline mode) display a styled internal error page rather than a blank screen.
- [ ] Sub-resource and main-frame loading states emit real-time progress events to the renderer.
- [ ] Unit and integration tests verify URL loading dispatch and error interceptors.
