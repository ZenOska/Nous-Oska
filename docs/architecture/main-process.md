# Main process

The Electron main process is the trusted coordinator for application lifecycle and privileged desktop capabilities. Planned responsibilities include creating application windows, managing browser sessions, mediating downloads and permissions, and enforcing navigation and security policies.

Keep privileged work here. Do not pass Node.js or unrestricted Electron APIs to web content. Expose renderer capabilities through the preload bridge and validated IPC contracts. This document records the intended boundary; implementation begins in Phase 1.
