# Renderer

The renderer hosts the browser interface: toolbar, tabs, address bar, window controls, and new-tab dashboard. Renderer code is treated as an untrusted boundary relative to the privileged main process.

The renderer never accesses Node.js directly. It interacts with the main process strictly via typed methods exposed through the preload `contextBridge` (`window.electronAPI`). Context isolation is enforced and audited at runtime, preventing arbitrary IPC channels, privilege escalation, or access to sensitive runtime resources.
