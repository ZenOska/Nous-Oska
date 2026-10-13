import type { WebContents } from 'electron';
import type { NavigationCapabilities } from './types.js';

/**
 * Tracks session navigation history state and enforces history stack integrity.
 */
export class NavigationHistoryTracker {
  /**
   * Assesses whether the active WebContents instance has preceding navigation entries.
   *
   * @param webContents Target WebContents reference.
   * @returns Boolean indicating if back traversal is permissible.
   */
  public canGoBack(webContents: WebContents | null): boolean {
    if (
      !webContents ||
      (typeof webContents.isDestroyed === 'function' && webContents.isDestroyed()) ||
      typeof webContents.canGoBack !== 'function'
    ) {
      return false;
    }
    return webContents.canGoBack();
  }

  /**
   * Assesses whether the active WebContents instance has succeeding navigation entries.
   *
   * @param webContents Target WebContents reference.
   * @returns Boolean indicating if forward traversal is permissible.
   */
  public canGoForward(webContents: WebContents | null): boolean {
    if (
      !webContents ||
      (typeof webContents.isDestroyed === 'function' && webContents.isDestroyed()) ||
      typeof webContents.canGoForward !== 'function'
    ) {
      return false;
    }
    return webContents.canGoForward();
  }

  /**
   * Constructs the current navigation capabilities snapshot for active WebContents.
   *
   * @param webContents Target WebContents reference.
   * @returns NavigationCapabilities snapshot.
   */
  public getCapabilities(webContents: WebContents | null): NavigationCapabilities {
    return {
      canGoBack: this.canGoBack(webContents),
      canGoForward: this.canGoForward(webContents),
    };
  }

  /**
   * Navigates back in the session history stack if preceding entries exist.
   * Enforces stack integrity by preventing illegal pops when canGoBack is false.
   *
   * @param webContents Target WebContents reference.
   * @returns Boolean indicating whether the back traversal was executed.
   */
  public goBack(webContents: WebContents | null): boolean {
    if (!this.canGoBack(webContents) || !webContents || typeof webContents.goBack !== 'function') {
      return false;
    }

    webContents.goBack();
    return true;
  }
}
