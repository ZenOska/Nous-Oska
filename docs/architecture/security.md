# Security architecture

Nous loads arbitrary websites, so security boundaries are part of the product architecture from day one. Follow Electron's current security guidance when implementing the shell and review settings whenever Electron is upgraded.

## Never

- Set `nodeIntegration: true` for content that can load websites.
- Expose Node.js or unrestricted Electron APIs to web pages.
- Provide arbitrary IPC channels or an unsafe preload API.
- Disable web security casually or to work around application bugs.
- Trust navigation destinations, IPC payloads, or permission requests without validation.

## Prefer

- `contextIsolation` enabled.
- Renderer sandboxing where appropriate and compatible with the design.
- A minimal `contextBridge` API with explicit methods and typed data.
- Validated IPC, with authorization in the main process.
- Explicit permission handling and secure navigation policies.
- Restricting new windows and external URL handling to deliberate, validated cases.
- Keeping Electron and dependencies current, and reviewing security advisories.

These are design principles, not claims that a browser has already been implemented or audited. See [Electron's security guidance](https://www.electronjs.org/docs/latest/tutorial/security).
