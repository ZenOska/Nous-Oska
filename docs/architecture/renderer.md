# Renderer

The renderer will host the React and TypeScript browser interface: toolbar, tabs, settings, and new-tab UI as those features are implemented. Treat renderer code as less trusted than the main process, particularly where untrusted websites are involved.

The renderer must not access Node.js directly. It will call only the narrow APIs deliberately exposed by preload. Browser UI and browser content should be isolated according to the Electron design chosen during Phase 1. No renderer application exists yet.
