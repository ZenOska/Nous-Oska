import { ipcMain, type WebContents } from 'electron';
import { generateNetErrorDataUrl } from './error-page.js';
import { NavigationHistoryTracker } from './history.js';
import type {
  NavigationCapabilities,
  NavigationHistoryAction,
  NavigationRequest,
  NavigationStateChange,
} from './types.js';
import { validateNavigationUrl } from './validator.js';

export const CHROMIUM_ERR_ABORTED = -3;
export const DEFAULT_TAB_ID = 'default';
export const DEFAULT_INITIAL_URL = 'about:blank';
export const DEFAULT_INITIAL_TITLE = 'New Tab';

export interface IpcMainHandler {
  handle: (channel: string, listener: (event: unknown, ...args: unknown[]) => unknown) => void;
  removeHandler: (channel: string) => void;
}

export interface NavigationControllerOptions {
  getWebContents: () => WebContents | null;
  onStateChange?: (state: NavigationStateChange) => void;
  onCapabilitiesChange?: (capabilities: NavigationCapabilities) => void;
  customIpcMain?: IpcMainHandler;
  historyTracker?: NavigationHistoryTracker;
}

/**
 * Orchestrates main-process URL navigation, WebContents lifecycle events,
 * history traversal, and error page interception for the Nous browser shell.
 */
export class NavigationController {
  private readonly getWebContents: () => WebContents | null;
  private readonly onStateChange?: (state: NavigationStateChange) => void;
  private readonly onCapabilitiesChange?: (capabilities: NavigationCapabilities) => void;
  private readonly ipc: IpcMainHandler;
  private readonly historyTracker: NavigationHistoryTracker;

  private activeWebContents: WebContents | null = null;
  private detachLifecycleListeners: (() => void) | null = null;
  private isIpcRegistered = false;

  private currentState: NavigationStateChange = {
    tabId: DEFAULT_TAB_ID,
    isLoading: false,
    url: DEFAULT_INITIAL_URL,
    title: DEFAULT_INITIAL_TITLE,
  };

  constructor(options: NavigationControllerOptions) {
    this.getWebContents = options.getWebContents;
    this.onStateChange = options.onStateChange;
    this.onCapabilitiesChange = options.onCapabilitiesChange;
    this.ipc = options.customIpcMain ?? ipcMain;
    this.historyTracker = options.historyTracker ?? new NavigationHistoryTracker();
  }

  /**
   * Binds lifecycle listeners to an active WebContents instance.
   *
   * @param webContents Target WebContents to monitor.
   */
  public attachWebContents(webContents: WebContents): void {
    if (this.activeWebContents === webContents) {
      return;
    }

    this.detachLifecycle();
    this.activeWebContents = webContents;

    const handleDidStartLoading = () => {
      this.currentState = {
        ...this.currentState,
        isLoading: true,
      };
      this.emitStateChange();
    };

    const handleDidFinishLoad = () => {
      if (!this.activeWebContents || this.activeWebContents.isDestroyed()) {
        return;
      }
      this.currentState = {
        ...this.currentState,
        isLoading: false,
        url: this.activeWebContents.getURL() || this.currentState.url,
        title: this.activeWebContents.getTitle() || this.currentState.title,
        errorCode: undefined,
        errorDescription: undefined,
      };
      this.emitStateChange();
      this.emitCapabilities();
    };

    const handleDidNavigate = (_event: unknown, url: string) => {
      this.currentState = {
        ...this.currentState,
        url: url || this.currentState.url,
      };
      this.emitStateChange();
      this.emitCapabilities();
    };

    const handleDidNavigateInPage = (_event: unknown, url: string) => {
      this.currentState = {
        ...this.currentState,
        url: url || this.currentState.url,
      };
      this.emitStateChange();
      this.emitCapabilities();
    };

    const handlePageTitleUpdated = (_event: unknown, title: string) => {
      this.currentState = {
        ...this.currentState,
        title: title || this.currentState.title,
      };
      this.emitStateChange();
    };

    const handleDidFailLoad = (
      _event: unknown,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame?: boolean,
    ) => {
      // Ignore subframes and user-initiated navigation aborts
      if (isMainFrame === false || errorCode === CHROMIUM_ERR_ABORTED) {
        return;
      }

      const failedDestination = validatedURL || this.currentState.url;
      const errorPageUrl = generateNetErrorDataUrl(failedDestination, errorCode, errorDescription);

      this.currentState = {
        ...this.currentState,
        isLoading: false,
        url: failedDestination,
        title: `Error: ${errorDescription || errorCode}`,
        errorCode,
        errorDescription,
      };
      this.emitStateChange();
      this.emitCapabilities();

      if (this.activeWebContents && !this.activeWebContents.isDestroyed()) {
        // Load styled error page without throwing raw crash alerts
        this.activeWebContents.loadURL(errorPageUrl).catch((err: unknown) => {
          console.error('[NavigationController] Failed to display error page:', err);
        });
      }
    };

    webContents.on('did-start-loading', handleDidStartLoading);
    webContents.on('did-finish-load', handleDidFinishLoad);
    webContents.on('did-navigate', handleDidNavigate as unknown as (...args: unknown[]) => void);
    webContents.on(
      'did-navigate-in-page',
      handleDidNavigateInPage as unknown as (...args: unknown[]) => void,
    );
    webContents.on(
      'page-title-updated',
      handlePageTitleUpdated as unknown as (...args: unknown[]) => void,
    );
    webContents.on('did-fail-load', handleDidFailLoad as unknown as (...args: unknown[]) => void);

    this.detachLifecycleListeners = () => {
      if (!webContents.isDestroyed()) {
        webContents.removeListener('did-start-loading', handleDidStartLoading);
        webContents.removeListener('did-finish-load', handleDidFinishLoad);
        webContents.removeListener(
          'did-navigate',
          handleDidNavigate as unknown as (...args: unknown[]) => void,
        );
        webContents.removeListener(
          'did-navigate-in-page',
          handleDidNavigateInPage as unknown as (...args: unknown[]) => void,
        );
        webContents.removeListener(
          'page-title-updated',
          handlePageTitleUpdated as unknown as (...args: unknown[]) => void,
        );
        webContents.removeListener(
          'did-fail-load',
          handleDidFailLoad as unknown as (...args: unknown[]) => void,
        );
      }
      this.activeWebContents = null;
      this.detachLifecycleListeners = null;
    };
  }

  /**
   * Detaches active WebContents lifecycle listeners.
   */
  public detachLifecycle(): void {
    if (this.detachLifecycleListeners) {
      this.detachLifecycleListeners();
    }
  }

  /**
   * Dispatches navigation to a validated URL on the active WebContents.
   *
   * @param request Navigation request containing target tabId and URL.
   */
  public async loadUrl(request: NavigationRequest): Promise<void> {
    const validatedUrl = validateNavigationUrl(request.url);

    let webContents = this.activeWebContents;
    if (!webContents || webContents.isDestroyed()) {
      webContents = this.getWebContents();
      if (webContents && !webContents.isDestroyed()) {
        this.attachWebContents(webContents);
      }
    }

    if (!webContents || webContents.isDestroyed()) {
      throw new Error('No active WebContents available for navigation');
    }

    this.currentState = {
      tabId: request.tabId,
      isLoading: true,
      url: validatedUrl,
      title: this.currentState.title,
      errorCode: undefined,
      errorDescription: undefined,
    };
    this.emitStateChange();

    await webContents.loadURL(validatedUrl);
    this.emitCapabilities();
  }

  /**
   * Navigates back in the session history stack for the active WebContents.
   *
   * @param action Optional history action payload.
   * @returns Boolean indicating whether navigation was performed.
   */
  public goBack(action?: NavigationHistoryAction): boolean {
    let webContents = this.activeWebContents;
    if (!webContents || webContents.isDestroyed()) {
      webContents = this.getWebContents();
      if (webContents && !webContents.isDestroyed()) {
        this.attachWebContents(webContents);
      }
    }

    if (!webContents || webContents.isDestroyed()) {
      return false;
    }

    const executed = this.historyTracker.goBack(webContents);
    if (executed) {
      if (action?.tabId) {
        this.currentState.tabId = action.tabId;
      }
      this.emitCapabilities();
    }
    return executed;
  }

  /**
   * Queries the current navigation capabilities for the active WebContents.
   *
   * @param tabId Optional tab identifier.
   * @returns NavigationCapabilities snapshot.
   */
  public getCapabilities(tabId?: string): NavigationCapabilities {
    void tabId;
    let webContents = this.activeWebContents;
    if (!webContents || webContents.isDestroyed()) {
      webContents = this.getWebContents();
      if (webContents && !webContents.isDestroyed()) {
        this.attachWebContents(webContents);
      }
    }
    return this.historyTracker.getCapabilities(webContents);
  }

  /**
   * Queries the current navigation state snapshot.
   *
   * @param tabId Optional tab identifier (defaults to active tab).
   * @returns Current NavigationStateChange snapshot.
   */
  public getState(tabId?: string): NavigationStateChange {
    if (tabId) {
      return { ...this.currentState, tabId };
    }
    return { ...this.currentState };
  }

  /**
   * Registers IPC handlers for renderer navigation queries and commands.
   */
  public registerIpcHandlers(): void {
    if (this.isIpcRegistered) {
      return;
    }

    this.ipc.handle('navigation:loadUrl', async (_event, ...args: unknown[]) => {
      const request = args[0] as NavigationRequest;
      await this.loadUrl(request);
    });

    this.ipc.handle('navigation:getState', async (_event, ...args: unknown[]) => {
      const tabId = typeof args[0] === 'string' ? args[0] : undefined;
      return this.getState(tabId);
    });

    this.ipc.handle('navigation:goBack', async (_event, ...args: unknown[]) => {
      const action = args[0] as NavigationHistoryAction | undefined;
      return this.goBack(action);
    });

    this.ipc.handle('navigation:getCapabilities', async (_event, ...args: unknown[]) => {
      const tabId = typeof args[0] === 'string' ? args[0] : undefined;
      return this.getCapabilities(tabId);
    });

    this.isIpcRegistered = true;
  }

  /**
   * Unregisters navigation IPC handlers.
   */
  public unregisterIpcHandlers(): void {
    if (!this.isIpcRegistered) {
      return;
    }

    this.ipc.removeHandler('navigation:loadUrl');
    this.ipc.removeHandler('navigation:getState');
    this.ipc.removeHandler('navigation:goBack');
    this.ipc.removeHandler('navigation:getCapabilities');

    this.isIpcRegistered = false;
  }

  /**
   * Emits the current navigation state to registered callbacks and renderer IPC.
   */
  private emitStateChange(): void {
    this.onStateChange?.(this.currentState);

    let webContents = this.activeWebContents;
    if (!webContents || webContents.isDestroyed()) {
      webContents = this.getWebContents();
    }

    if (webContents && !webContents.isDestroyed()) {
      webContents.send('navigation:stateChange', this.currentState);
    }
  }

  /**
   * Emits the current navigation capabilities to registered callbacks and renderer IPC.
   */
  private emitCapabilities(): void {
    const capabilities = this.getCapabilities();
    this.onCapabilitiesChange?.(capabilities);

    let webContents = this.activeWebContents;
    if (!webContents || webContents.isDestroyed()) {
      webContents = this.getWebContents();
    }

    if (webContents && !webContents.isDestroyed()) {
      webContents.send('navigation:capabilities', capabilities);
    }
  }

  /**
   * Completely tears down controller, unbinding handlers and listeners.
   */
  public destroy(): void {
    this.unregisterIpcHandlers();
    this.detachLifecycle();
  }
}
