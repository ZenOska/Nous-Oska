import type { NavigationCapabilities } from '../globals.js';
import type { RendererIpcClient } from '../ipc/index.js';

export const MOUSE_BACK_BUTTON = 3;

export interface HistoryControllerOptions {
  backBtn?: HTMLElement | null;
  ipcClient?: RendererIpcClient;
  onGoBack?: () => void;
  getTabId?: () => string | undefined;
}

/**
 * Manages the toolbar Back navigation button, keyboard shortcuts,
 * and capability synchronization for the active browsing session.
 */
export class HistoryController {
  private readonly backBtn: HTMLElement | null;
  private readonly ipcClient?: RendererIpcClient;
  private readonly onGoBackCallback?: () => void;
  private readonly getTabIdCallback?: () => string | undefined;

  private canGoBack = false;
  private unsubscribeCapabilities?: () => void;
  private boundClickHandler?: () => void;
  private boundKeyDownHandler?: (e: KeyboardEvent) => void;
  private boundMouseUpHandler?: (e: MouseEvent) => void;

  constructor(options: HistoryControllerOptions = {}) {
    this.backBtn = options.backBtn ?? null;
    this.ipcClient = options.ipcClient;
    this.onGoBackCallback = options.onGoBack;
    this.getTabIdCallback = options.getTabId;

    this.init();
  }

  /**
   * Initializes event listeners and IPC capability synchronization.
   */
  public init(): void {
    this.updateUI();

    if (this.backBtn) {
      this.boundClickHandler = () => {
        void this.triggerBack();
      };
      this.backBtn.addEventListener('click', this.boundClickHandler);
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
   * Sets current navigation capabilities and updates visual button state.
   *
   * @param capabilities Capability state snapshot.
   */
  public setCapabilities(capabilities: NavigationCapabilities): void {
    this.canGoBack = Boolean(capabilities.canGoBack);
    this.updateUI();
  }

  /**
   * Returns current canGoBack state.
   */
  public getCanGoBack(): boolean {
    return this.canGoBack;
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
   * Evaluates keyboard shortcut events for back navigation invocation.
   * Supports Alt+Left Arrow (Windows/Linux) and Cmd+[ (macOS).
   *
   * @param e Keyboard event.
   */
  public handleKeyboardShortcut(e: KeyboardEvent): boolean {
    const isAltLeft = e.altKey && e.key === 'ArrowLeft';
    const isCmdBracket = (e.metaKey || e.ctrlKey) && e.key === '[';

    if (isAltLeft || isCmdBracket) {
      e.preventDefault();
      void this.triggerBack();
      return true;
    }

    return false;
  }

  /**
   * Synchronizes DOM attributes and styles for the Back button in O(1) time.
   */
  private updateUI(): void {
    if (!this.backBtn) {
      return;
    }

    if ('disabled' in this.backBtn) {
      (this.backBtn as HTMLButtonElement).disabled = !this.canGoBack;
    }

    if (this.canGoBack) {
      this.backBtn.removeAttribute('disabled');
      this.backBtn.classList.remove('disabled');
      this.backBtn.setAttribute('aria-disabled', 'false');
    } else {
      this.backBtn.setAttribute('disabled', 'true');
      this.backBtn.classList.add('disabled');
      this.backBtn.setAttribute('aria-disabled', 'true');
    }
  }

  /**
   * Cleans up all attached event listeners and IPC subscriptions.
   */
  public destroy(): void {
    if (this.backBtn && this.boundClickHandler) {
      this.backBtn.removeEventListener('click', this.boundClickHandler);
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
