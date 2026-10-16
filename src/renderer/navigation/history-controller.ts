import type { NavigationCapabilities } from '../globals.js';
import type { RendererIpcClient } from '../ipc/index.js';

export const MOUSE_BACK_BUTTON = 3;
export const MOUSE_FORWARD_BUTTON = 4;

export interface HistoryControllerOptions {
  backBtn?: HTMLElement | null;
  forwardBtn?: HTMLElement | null;
  ipcClient?: RendererIpcClient;
  onGoBack?: () => void;
  onGoForward?: () => void;
  getTabId?: () => string | undefined;
}

/**
 * Manages the toolbar Back & Forward navigation buttons, keyboard shortcuts,
 * and capability synchronization for the active browsing session.
 */
export class HistoryController {
  private readonly backBtn: HTMLElement | null;
  private readonly forwardBtn: HTMLElement | null;
  private readonly ipcClient?: RendererIpcClient;
  private readonly onGoBackCallback?: () => void;
  private readonly onGoForwardCallback?: () => void;
  private readonly getTabIdCallback?: () => string | undefined;

  private canGoBack = false;
  private canGoForward = false;
  private unsubscribeCapabilities?: () => void;
  private boundBackClickHandler?: () => void;
  private boundForwardClickHandler?: () => void;
  private boundKeyDownHandler?: (e: KeyboardEvent) => void;
  private boundMouseUpHandler?: (e: MouseEvent) => void;

  constructor(options: HistoryControllerOptions = {}) {
    this.backBtn = options.backBtn ?? null;
    this.forwardBtn = options.forwardBtn ?? null;
    this.ipcClient = options.ipcClient;
    this.onGoBackCallback = options.onGoBack;
    this.onGoForwardCallback = options.onGoForward;
    this.getTabIdCallback = options.getTabId;

    this.init();
  }

  /**
   * Initializes event listeners and IPC capability synchronization.
   */
  public init(): void {
    this.updateUI();

    if (this.backBtn) {
      this.boundBackClickHandler = () => {
        void this.triggerBack();
      };
      this.backBtn.addEventListener('click', this.boundBackClickHandler);
    }

    if (this.forwardBtn) {
      this.boundForwardClickHandler = () => {
        void this.triggerForward();
      };
      this.forwardBtn.addEventListener('click', this.boundForwardClickHandler);
    }

    if (typeof document !== 'undefined') {
      this.boundKeyDownHandler = (e: KeyboardEvent) => {
        this.handleKeyboardShortcut(e);
      };
      document.addEventListener('keydown', this.boundKeyDownHandler);
    }

    if (typeof window !== 'undefined') {
      this.boundMouseUpHandler = (e: MouseEvent) => {
        if (e.button === MOUSE_BACK_BUTTON) {
          e.preventDefault();
          void this.triggerBack();
        } else if (e.button === MOUSE_FORWARD_BUTTON) {
          e.preventDefault();
          void this.triggerForward();
        }
      };
      window.addEventListener('mouseup', this.boundMouseUpHandler);
    }

    if (this.ipcClient?.isAvailable()) {
      this.unsubscribeCapabilities = this.ipcClient.onCapabilitiesChange((capabilities) => {
        this.setCapabilities(capabilities);
      });

      // Query initial capabilities snapshot
      this.ipcClient
        .getNavigationCapabilities()
        .then((caps) => {
          this.setCapabilities(caps);
        })
        .catch(() => {
          // Graceful fallback in detached or test contexts
        });
    }
  }

  /**
   * Sets current navigation capabilities and updates visual button states.
   *
   * @param capabilities Capability state snapshot.
   */
  public setCapabilities(capabilities: NavigationCapabilities): void {
    this.canGoBack = Boolean(capabilities.canGoBack);
    this.canGoForward = Boolean(capabilities.canGoForward);
    this.updateUI();
  }

  /**
   * Returns current canGoBack state.
   */
  public getCanGoBack(): boolean {
    return this.canGoBack;
  }

  /**
   * Returns current canGoForward state.
   */
  public getCanGoForward(): boolean {
    return this.canGoForward;
  }

  /**
   * Executes back navigation if preceding history entries exist.
   *
   * @returns Promise resolving to boolean indicating whether back navigation occurred.
   */
  public async triggerBack(): Promise<boolean> {
    if (!this.canGoBack) {
      return false;
    }

    this.onGoBackCallback?.();

    if (this.ipcClient?.isAvailable()) {
      try {
        const tabId = this.getTabIdCallback?.();
        await this.ipcClient.goBack(tabId ? { tabId } : undefined);
      } catch (error) {
        console.error('[HistoryController] Failed to dispatch goBack across IPC:', error);
      }
    }

    return true;
  }

  /**
   * Executes forward navigation if succeeding history entries exist.
   *
   * @returns Promise resolving to boolean indicating whether forward navigation occurred.
   */
  public async triggerForward(): Promise<boolean> {
    if (!this.canGoForward) {
      return false;
    }

    this.onGoForwardCallback?.();

    if (this.ipcClient?.isAvailable()) {
      try {
        const tabId = this.getTabIdCallback?.();
        await this.ipcClient.goForward(tabId ? { tabId } : undefined);
      } catch (error) {
        console.error('[HistoryController] Failed to dispatch goForward across IPC:', error);
      }
    }

    return true;
  }

  /**
   * Evaluates keyboard shortcut events for history traversal invocation.
   * Supports Alt+Left / Cmd+[ for Back, and Alt+Right / Cmd+] for Forward.
   *
   * @param e Keyboard event.
   */
  public handleKeyboardShortcut(e: KeyboardEvent): boolean {
    const isAltLeft = e.altKey && e.key === 'ArrowLeft';
    const isCmdBack = (e.metaKey || e.ctrlKey) && e.key === '[';

    const isAltRight = e.altKey && e.key === 'ArrowRight';
    const isCmdForward = (e.metaKey || e.ctrlKey) && e.key === ']';

    if (isAltLeft || isCmdBack) {
      e.preventDefault();
      void this.triggerBack();
      return true;
    }

    if (isAltRight || isCmdForward) {
      e.preventDefault();
      void this.triggerForward();
      return true;
    }

    return false;
  }

  /**
   * Synchronizes DOM attributes and styles for button elements in O(1) time.
   */
  private updateButtonState(btn: HTMLElement | null, enabled: boolean): void {
    if (!btn) {
      return;
    }

    if ('disabled' in btn) {
      (btn as HTMLButtonElement).disabled = !enabled;
    }

    if (enabled) {
      btn.removeAttribute('disabled');
      btn.classList.remove('disabled');
      btn.setAttribute('aria-disabled', 'false');
    } else {
      btn.setAttribute('disabled', 'true');
      btn.classList.add('disabled');
      btn.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Synchronizes visual states for both Back and Forward buttons.
   */
  private updateUI(): void {
    this.updateButtonState(this.backBtn, this.canGoBack);
    this.updateButtonState(this.forwardBtn, this.canGoForward);
  }

  /**
   * Cleans up all attached event listeners and IPC subscriptions.
   */
  public destroy(): void {
    if (this.backBtn && this.boundBackClickHandler) {
      this.backBtn.removeEventListener('click', this.boundBackClickHandler);
    }

    if (this.forwardBtn && this.boundForwardClickHandler) {
      this.forwardBtn.removeEventListener('click', this.boundForwardClickHandler);
    }

    if (this.boundKeyDownHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.boundKeyDownHandler);
    }

    if (this.boundMouseUpHandler && typeof window !== 'undefined') {
      window.removeEventListener('mouseup', this.boundMouseUpHandler);
    }

    this.unsubscribeCapabilities?.();
    this.unsubscribeCapabilities = undefined;
  }
}
