# Forward Navigation & Stack Branching

## Purpose

The Forward Navigation and Stack Branching component manages forward session history traversal, forward-stack integrity protection, and real-time toolbar enablement synchronization for Phase 1 of the Nous desktop browser shell. It tracks forward navigation capabilities across active `WebContents` instances, binds global keyboard shortcuts (`Alt+Right Arrow`, `Cmd+]`) and auxiliary mouse forward buttons (button 4), and enforces the fundamental stack branching guarantee: navigating to a new URL while viewing an older history entry immediately truncates and invalidates the forward history branch.

## Dependencies

- Electron `WebContents` (`canGoForward`, `goForward`, `canGoBack`, `loadURL`).
- `NavigationHistoryTracker` (`src/main/navigation/history.ts`).
- `NavigationController` (`src/main/navigation/controller.ts`).
- Preload context bridge (`ElectronAPI.navigation.goForward`).
- Renderer IPC client (`RendererIpcClient.goForward`).
- Renderer UI controller (`HistoryController`).
- DOM Toolbar button (`#forward-btn` in `src/renderer/index.html`).

## Big-O Complexity

- **Stack Capability Assessment (`canGoForward`)**: $O(1)$ constant-time query on active WebContents session history.
- **Forward Navigation Traversal (`goForward`)**: $O(1)$ constant-time operation advancing the native Chromium history stack pointer.
- **Branch Truncation Evaluation**: $O(1)$ constant-time forward stack invalidation upon dispatching a new URL load.
- **Toolbar UI Synchronization (`updateUI`)**: $O(1)$ constant-time DOM attribute (`disabled`, `aria-disabled`) and class toggle.
- **Shortcut Keydown & Mouseup Filtering**: $O(1)$ constant-time event pattern matching.

## Architecture

```mermaid
graph TD
    UserAction["User Action (Click #forward-btn / Alt+Right / Cmd+] / Mouse Button 4)"] --> HistoryController["HistoryController (Renderer)"]
    HistoryController -->|Check canGoForward| Guard{"canGoForward === true?"}
    Guard -->|No| Suppress[Ignore & Prevent illegal stack advance]
    Guard -->|Yes| IPCBridge["Preload Bridge (navigation:goForward)"]
    IPCBridge --> NavController["NavigationController (Main)"]
    NavController --> HistoryTracker["NavigationHistoryTracker"]
    HistoryTracker --> WebContents["WebContents.goForward()"]
    WebContents -->|did-navigate / did-navigate-in-page| NavController
    NavController -->|navigation:capabilities| IPCBridge
    IPCBridge --> HistoryController
    HistoryController -->|O(1) updateButtonState| DOMBtn["Toolbar Forward Button (#forward-btn)"]
```

## Forward Stack Branching Invariant

When traversing backward across a navigation session and subsequently committing a new destination URL, the browser's linear history stack branches, permanently clearing all forward entries:

$$\text{Initial Session Stack}: [S_0 \to S_1 \to S_2]$$
$$\text{Traverse Backward}: \text{Current} = S_1, \; \text{Forward Stack} = [S_2], \; \text{canGoForward} = \text{true}$$

$$\text{Case A (Linear Forward)}: \text{Click Forward} \implies \text{Current} = S_2, \; \text{Forward Stack} = \emptyset, \; \text{canGoForward} = \text{false}$$

$$\text{Case B (Stack Branching)}: \text{Navigate to } S_{\text{new}} \implies \text{Session Stack} = [S_0 \to S_1 \to S_{\text{new}}], \; \text{Forward Stack} = \emptyset, \; \text{canGoForward} = \text{false}$$

### Branch Invalidation Flow

```mermaid
sequenceDiagram
    participant User
    participant AddressBar
    participant NavController
    participant Chromium
    participant HistoryController

    Note over Chromium: Stack: [A, B, C] | Pointer at B (canGoForward: true)
    User->>AddressBar: Enter "https://news.ycombinator.com"
    AddressBar->>NavController: navigation:loadUrl(D)
    NavController->>Chromium: webContents.loadURL(D)
    Note over Chromium: Forward history [C] discarded; Stack becomes [A, B, D]
    Chromium-->>NavController: did-finish-load / did-navigate
    NavController->>NavController: emitCapabilities() (canGoForward = false)
    NavController-->>HistoryController: navigation:capabilities { canGoBack: true, canGoForward: false }
    HistoryController->>HistoryController: updateButtonState(forwardBtn, false)
    Note over HistoryController: Forward button immediately disabled
```

## Shortcuts & Interaction Matrix

| Trigger                   | Modifier / Key                      | Platform               | Action                                             |
| ------------------------- | ----------------------------------- | ---------------------- | -------------------------------------------------- |
| Toolbar Button Click      | Primary Pointer (Mouse 0 / Touch)   | All                    | Dispatches `triggerForward()` if enabled           |
| Alt Navigation            | `Alt + ArrowRight`                  | Windows / Linux        | Dispatches `triggerForward()` & `preventDefault()` |
| Mac / Terminal Navigation | `Cmd + ]` or `Ctrl + ]`             | macOS / Cross-platform | Dispatches `triggerForward()` & `preventDefault()` |
| Mouse Auxiliary           | Mouse Button 4 / 5 (`button === 4`) | All                    | Dispatches `triggerForward()` & `preventDefault()` |

## Stack Integrity Safeguards

1. **Forward Overflow Protection**: When `canGoForward()` evaluates to `false` (session is at the frontier/newest entry), `HistoryController` suppresses dispatch, and `NavigationHistoryTracker` rejects calls to `webContents.goForward()`, preventing illegal stack overflows.
2. **Deterministic Branch Truncation**: Any invocation of `loadUrl()` forces an automatic recalculation and broadcast of `NavigationCapabilities`, reflecting Chromium's truncation of forward history.
3. **Cross-Process Fault Isolation**: Forward navigation commands traverse context isolation via typed IPC contracts (`navigation:goForward` with optional `tabId`). Unhandled exceptions in the renderer or destroyed web contents are handled without main-process crashes.
