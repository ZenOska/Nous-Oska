import type {
  ElectronAPI,
  NavigationCapabilities,
  NavigationHistoryAction,
  NavigationRequest,
  NavigationStateChange,
  WindowState,
} from '../globals.js';

export class RendererIpcClient {
  constructor(
    private readonly api: ElectronAPI | undefined = typeof window !== 'undefined'
      ? window.electronAPI
      : undefined,
  ) {}

  public isAvailable(): boolean {
    return Boolean(this.api);
  }

  private ensureApi(): ElectronAPI {
    if (!this.api) {
      throw new Error('Electron IPC bridge is not available in the current context');
    }
    return this.api;
  }

  public async getAppVersion(): Promise<string> {
    const api = this.ensureApi();
    return api.app.getVersion();
  }

  public async getAppName(): Promise<string> {
    const api = this.ensureApi();
    return api.app.getName();
  }

  public async getPlatform(): Promise<string> {
    const api = this.ensureApi();
    return api.platform.get();
  }

  public async openExternal(targetUrl: string): Promise<void> {
    const api = this.ensureApi();
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      throw new Error(`Disallowed protocol for external navigation: ${parsed.protocol}`);
    }
    await api.shell.openExternal(targetUrl);
  }

  public async minimizeWindow(): Promise<void> {
    const api = this.ensureApi();
    await api.window.minimize();
  }

  public async maximizeWindow(): Promise<void> {
    const api = this.ensureApi();
    await api.window.maximize();
  }

  public async unmaximizeWindow(): Promise<void> {
    const api = this.ensureApi();
    await api.window.unmaximize();
  }

  public async toggleMaximizeWindow(): Promise<void> {
    const api = this.ensureApi();
    await api.window.toggleMaximize();
  }

  public async closeWindow(): Promise<void> {
    const api = this.ensureApi();
    await api.window.close();
  }

  public async isWindowMaximized(): Promise<boolean> {
    const api = this.ensureApi();
    return api.window.isMaximized();
  }

  public async getWindowState(): Promise<WindowState | null> {
    const api = this.ensureApi();
    return api.window.getState();
  }

  public async loadUrl(request: NavigationRequest): Promise<void> {
    const api = this.ensureApi();
    await api.navigation.loadUrl(request);
  }

  public async getNavigationState(tabId?: string): Promise<NavigationStateChange | null> {
    const api = this.ensureApi();
    return api.navigation.getState(tabId);
  }

  public onNavigationStateChange(callback: (state: NavigationStateChange) => void): () => void {
    const api = this.ensureApi();
    return api.navigation.onStateChange(callback);
  }

  public async goBack(action?: NavigationHistoryAction | string): Promise<boolean> {
    const api = this.ensureApi();
    const payload: NavigationHistoryAction | undefined =
      typeof action === 'string' ? { tabId: action } : action;
    return api.navigation.goBack(payload);
  }

  public async goForward(action?: NavigationHistoryAction | string): Promise<boolean> {
    const api = this.ensureApi();
    const payload: NavigationHistoryAction | undefined =
      typeof action === 'string' ? { tabId: action } : action;
    return api.navigation.goForward(payload);
  }

  public async getNavigationCapabilities(tabId?: string): Promise<NavigationCapabilities> {
    const api = this.ensureApi();
    return api.navigation.getCapabilities(tabId);
  }

  public onCapabilitiesChange(
    callback: (capabilities: NavigationCapabilities) => void,
  ): () => void {
    const api = this.ensureApi();
    return api.navigation.onCapabilitiesChange(callback);
  }
}
