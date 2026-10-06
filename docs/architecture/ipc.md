# Inter-process communication

IPC is the explicit boundary between renderer UI and privileged main-process operations. Define a small set of named operations with typed request and response shapes. Validate all input in the main process, authorize operations there, and return only the data the renderer needs.

Do not expose generic `send`, `invoke`, or arbitrary channel selection to the renderer. Do not trust renderer input merely because the bundled UI sent it. Keep contracts in shared types where practical and document each capability. IPC contracts will be implemented alongside the Phase 1 shell.
