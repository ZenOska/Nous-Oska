import type { RendererIpcClient } from '../ipc/index.js';

export interface WindowControlElements {
  minimizeBtn: HTMLElement | null;
  maximizeBtn: HTMLElement | null;
  closeBtn: HTMLElement | null;
}

export class WindowControls {
  constructor(
    private readonly elements: WindowControlElements,
    private readonly ipcClient: RendererIpcClient,
  ) {}

  public init(): void {
    if (this.ipcClient.isAvailable()) {
      this.elements.minimizeBtn?.addEventListener('click', () => {
        void this.ipcClient.minimizeWindow();
      });

      this.elements.maximizeBtn?.addEventListener('click', () => {
        void this.ipcClient.toggleMaximizeWindow();
      });

      this.elements.closeBtn?.addEventListener('click', () => {
        void this.ipcClient.closeWindow();
      });

      void this.syncState();
    } else {
      if (this.elements.minimizeBtn) {
        this.elements.minimizeBtn.style.display = 'none';
      }
      if (this.elements.maximizeBtn) {
        this.elements.maximizeBtn.style.display = 'none';
      }
      this.elements.closeBtn?.addEventListener('click', () => {
        window.close?.();
      });
    }
  }

  public async syncState(): Promise<void> {
    if (!this.ipcClient.isAvailable()) return;
    try {
      const isMax = await this.ipcClient.isWindowMaximized();
      if (this.elements.maximizeBtn) {
        this.elements.maximizeBtn.title = isMax ? 'Restore' : 'Maximize';
        this.elements.maximizeBtn.setAttribute('aria-label', isMax ? 'Restore' : 'Maximize');
      }
    } catch {
      // IPC calls may fail during teardown or unit testing
    }
  }
}
