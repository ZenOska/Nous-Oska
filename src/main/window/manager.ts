import { BrowserWindow, ipcMain, screen, type Rectangle } from 'electron';
import { getBrowserWindowDefaults, type BrowserWindowConfig } from './config.js';
import { attachWindowLifecycle, type WindowLifecycleCallbacks } from './lifecycle.js';

export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  bounds: Rectangle;
}

export interface WindowManagerOptions {
  preloadPath: string;
  prodIndexPath: string;
  isDev?: boolean;
  devServerUrl?: string;
  callbacks?: WindowLifecycleCallbacks;
}

/**
 * Manages the lifecycle, state, and IPC interaction of the primary Nous browser window.
 */
export class BrowserWindowManager {
  private mainWindow: BrowserWindow | null = null;
  private detachLifecycle: (() => void) | null = null;
  private ipcRegistered = false;

  constructor(private readonly options: WindowManagerOptions) {}

  /**
   * Instantiates and configures the main browser window.
   *
   * @param customConfig Optional configuration overrides.
   * @returns The created BrowserWindow instance.
   */
  public createWindow(customConfig?: Partial<BrowserWindowConfig>): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
      return this.mainWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const workAreaSize = primaryDisplay ? primaryDisplay.workAreaSize : undefined;

    const windowOptions = getBrowserWindowDefaults({
      preloadPath: this.options.preloadPath,
      workAreaSize,
      ...customConfig,
    });

    const window = new BrowserWindow(windowOptions);
    this.mainWindow = window;

    this.detachLifecycle = attachWindowLifecycle(window, {
      isDev: this.options.isDev,
      callbacks: {
        ...this.options.callbacks,
        onClosed: () => {
          this.detachLifecycle?.();
          this.detachLifecycle = null;
          this.mainWindow = null;
          this.options.callbacks?.onClosed?.();
        },
      },
    });

    if (this.options.isDev && this.options.devServerUrl) {
      window.loadURL(this.options.devServerUrl);
      window.webContents.openDevTools({ mode: 'detach' });
    } else {
      window.loadFile(this.options.prodIndexPath);
    }

    return window;
  }

  /**
   * Returns the current BrowserWindow reference, or null if uninstantiated.
   */
  public getWindow(): BrowserWindow | null {
    return this.mainWindow && !this.mainWindow.isDestroyed() ? this.mainWindow : null;
  }

  /**
   * Indicates whether an active, non-destroyed main window exists.
   */
  public hasWindow(): boolean {
    return this.getWindow() !== null;
  }

  /**
   * Retrieves the current geometry and display states of the main window.
   */
  public getState(): WindowState | null {
    const window = this.getWindow();
    if (!window) {
      return null;
    }

    return {
      isMaximized: window.isMaximized(),
      isMinimized: window.isMinimized(),
      isFocused: window.isFocused(),
      isVisible: window.isVisible(),
      bounds: window.getBounds(),
    };
  }

  public minimize(): void {
    const window = this.getWindow();
    if (window) {
      window.minimize();
    }
  }

  public maximize(): void {
    const window = this.getWindow();
    if (window && !window.isMaximized()) {
      window.maximize();
    }
  }

  public unmaximize(): void {
    const window = this.getWindow();
    if (window && window.isMaximized()) {
      window.unmaximize();
    }
  }

  public toggleMaximize(): void {
    const window = this.getWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  }

  public isMaximized(): boolean {
    const window = this.getWindow();
    return window ? window.isMaximized() : false;
  }

  public focus(): void {
    const window = this.getWindow();
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }

  public close(): void {
    const window = this.getWindow();
    if (window) {
      window.close();
    }
  }

  /**
   * Registers IPC handlers for renderer window control calls.
   */
  public registerIpcHandlers(): void {
    if (this.ipcRegistered) {
      return;
    }

    ipcMain.handle('window:minimize', () => this.minimize());
    ipcMain.handle('window:maximize', () => this.maximize());
    ipcMain.handle('window:unmaximize', () => this.unmaximize());
    ipcMain.handle('window:toggleMaximize', () => this.toggleMaximize());
    ipcMain.handle('window:close', () => this.close());
    ipcMain.handle('window:isMaximized', () => this.isMaximized());
    ipcMain.handle('window:getState', () => this.getState());

    this.ipcRegistered = true;
  }

  /**
   * Unregisters IPC handlers previously bound by this manager.
   */
  public unregisterIpcHandlers(): void {
    if (!this.ipcRegistered) {
      return;
    }

    ipcMain.removeHandler('window:minimize');
    ipcMain.removeHandler('window:maximize');
    ipcMain.removeHandler('window:unmaximize');
    ipcMain.removeHandler('window:toggleMaximize');
    ipcMain.removeHandler('window:close');
    ipcMain.removeHandler('window:isMaximized');
    ipcMain.removeHandler('window:getState');

    this.ipcRegistered = false;
  }

  /**
   * Cleanly closes the active window and detaches listeners.
   */
  public destroy(): void {
    this.unregisterIpcHandlers();
    this.detachLifecycle?.();
    this.detachLifecycle = null;

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
      this.mainWindow = null;
    }
  }
}
