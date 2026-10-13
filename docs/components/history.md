# Back Navigation & History State Tracker

## Purpose

The Back Navigation and History State Tracker manages session history traversal, stack integrity protection, and real-time toolbar enablement synchronization for Phase 1 of the Nous desktop browser shell. It tracks preceding and succeeding navigation entries across active `WebContents` instances, binds keyboard shortcuts and mouse back events, and guarantees an $O(1)$ constant-time toolbar button state update across the Electron IPC boundary.

## Dependencies

- Electron `WebContents` (`canGoBack`, `goBack`, `canGoForward`).
- `NavigationHistoryTracker` (`src/main/navigation/history.ts`).
- `NavigationController` (`src/main/navigation/controller.ts`).
- Preload context bridge (`ElectronAPI.navigation`).
- Renderer IPC client (`RendererIpcClient`).
- Renderer UI controller (`HistoryController`).

## Big-O Complexity

- **Stack Capability Assessment (`canGoBack`, `canGoForward`)**: $O(1)$ constant time check on active WebContents session stack.
- **Back Navigation Traversal (`goBack`)**: $O(1)$ operation invoking native Chromium history pop.
- **Toolbar UI Synchronization (`updateUI`)**: $O(1)$ constant time DOM attribute (`disabled`, `aria-disabled`) and class list toggle.
- **Shortcut Keydown & Mouseup Filtering**: $O(1)$ constant time event pattern match.

## Architecture

```mermaid
graph TD
    UserAction["User Action (Click / Alt+Left / Cmd+[ / Mouse Button 3)"] --> HistoryController["HistoryController (Renderer)"]
    HistoryController -->|Check canGoBack| Guard{"canGoBack === true?"}
    Guard -->|No| Suppress[Ignore & Prevent illegal pop]
    Guard -->|Yes| IPCBridge["Preload Bridge (navigation:goBack)"]
    IPCBridge --> NavController["NavigationController (Main)"]
    NavController --> HistoryTracker["NavigationHistoryTracker"]
    HistoryTracker --> WebContents["WebContents.goBack()"]
    WebContents -->|did-navigate / did-navigate-in-page| NavController
    NavController -->|navigation:capabilities| IPCBridge
    IPCBridge --> HistoryController
    HistoryController -->|O(1) updateUI| DOMBtn["Toolbar Back Button (disabled attribute / opacity)"]
```

## Shortcuts & Interaction Matrix

| Trigger                   | Modifier / Key                      | Platform               | Action                                          |
| ------------------------- | ----------------------------------- | ---------------------- | ----------------------------------------------- |
| Toolbar Button Click      | Primary Pointer (Mouse 0 / Touch)   | All                    | Dispatches `triggerBack()` if enabled           |
| Alt Navigation            | `Alt + ArrowLeft`                   | Windows / Linux        | Dispatches `triggerBack()` & `preventDefault()` |
| Mac / Terminal Navigation | `Cmd + [` or `Ctrl + [`             | macOS / Cross-platform | Dispatches `triggerBack()` & `preventDefault()` |
| Mouse Auxiliary           | Mouse Button 3 / 4 (`button === 3`) | All                    | Dispatches `triggerBack()` & `preventDefault()` |

## Stack Integrity Safeguards

- **Underflow Protection**: When `canGoBack()` evaluates to false (initial blank tab or single-page session), `HistoryController` blocks event dispatch, and `NavigationHistoryTracker` refuses calls to `webContents.goBack()`, preventing history stack underflow errors.
- **In-Page Hash Navigation**: Anchor navigation events (`did-navigate-in-page`) update the session entry stack and immediately broadcast refreshed capabilities to the renderer.
- **Process Isolation**: The renderer never touches Electron `WebContents` directly; all state traversals execute across strictly guarded IPC contracts (`navigation:goBack` and `navigation:capabilities`).
