# Architecture overview

## Product boundary

Nous is a desktop browser application built around Chromium through Electron. Nous owns browser UI, lifecycle, settings, and the application features around web content; Chromium provides the web platform and rendering engine. Nous is not a new rendering engine.

## Process model

```text
                    NOUS
                      │
          ┌───────────┴───────────┐
          │                       │
     Electron Main            Renderer
   native capabilities          React UI
          │                  tabs, toolbar,
 windows, sessions,            settings
 downloads, security              │
          └──────────┬────────────┘
                     │ IPC
                  Preload
             secure API bridge
                     │
                  Chromium
                     │
                    Web
```

The main process owns privileged operations and application lifecycle. The renderer presents browser UI and must be treated as less trusted. Preload exposes a small, explicit API across that boundary. IPC messages must be validated and limited to the capabilities the UI needs. Websites must not gain direct access to Node.js or arbitrary application IPC.

## Technology decisions

Electron and Chromium; React and TypeScript; Vite and Tailwind CSS; pnpm; Zustand; Vitest and Playwright; ESLint and Prettier; GitHub Actions. The Electron, Vite, React, and TypeScript application will be initialized as one coherent project in Phase 1.

## Scope

Phase 0 records the architecture and team workflow. It does not implement a window, tabs, navigation, history, bookmarks, downloads, or other browser functionality. See the [roadmap](../roadmap/roadmap.md).

## Related documents

- [Main process](main-process.md)
- [Renderer](renderer.md)
- [IPC](ipc.md)
- [Security](security.md)
