import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

vi.mock('electron', async () => {
  const { EventEmitter: Emitter } = await import('node:events');
  const handlers = new Map<string, (...args: unknown[]) => unknown>();

  class MockWebContents extends Emitter {
    public openDevTools = vi.fn();
    public setWindowOpenHandler = vi.fn();
    public removeListener = vi.fn();
  }

  class MockBrowserWindow extends Emitter {
    public webContents = new MockWebContents();
    public loadURL = vi.fn();
    public loadFile = vi.fn();
    public show = vi.fn();
    public focus = vi.fn();
    public restore = vi.fn();
    public minimize = vi.fn();
    public maximize = vi.fn();
    public unmaximize = vi.fn();
    public close = vi.fn();
    public destroy = vi.fn(() => {
      this.isDestroyedFlag = true;
    });

    public isMaximizedState = false;
    public isMinimizedState = false;
    public isFocusedState = true;
    public isVisibleState = true;
    public isDestroyedFlag = false;
    public bounds = { x: 0, y: 0, width: 1400, height: 900 };

    constructor(public options: Record<string, unknown> = {}) {
      super();
    }

    public isMaximized() {
      return this.isMaximizedState;
    }
    public isMinimized() {
      return this.isMinimizedState;
    }
    public isFocused() {
      return this.isFocusedState;
    }
    public isVisible() {
      return this.isVisibleState;
    }
    public isDestroyed() {
      return this.isDestroyedFlag;
    }
    public getBounds() {
      return this.bounds;
    }
  }

  return {
    app: {
      isPackaged: true,
    },
    screen: {
      getPrimaryDisplay: vi.fn(() => ({
        workAreaSize: { width: 1920, height: 1080 },
      })),
    },
    BrowserWindow: MockBrowserWindow,
    ipcMain: {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        handlers.set(channel, handler);
      }),
      removeHandler: vi.fn((channel: string) => {
        handlers.delete(channel);
      }),
      _handlers: handlers,
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(undefined),
    },
  };
});

import { ipcMain } from 'electron';
import { BrowserWindowManager } from '../../src/main/window/manager.js';

interface MockIpcMainWithHandlers {
  _handlers: Map<string, (...args: unknown[]) => unknown>;
}

interface MockWinInstance extends EventEmitter {
  loadFile: ReturnType<typeof vi.fn>;
  loadURL: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  maximize: ReturnType<typeof vi.fn>;
  unmaximize: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  isMinimizedState: boolean;
  isMaximizedState: boolean;
  webContents: {
    openDevTools: ReturnType<typeof vi.fn>;
  };
}

describe('BrowserWindowManager', () => {
  let manager: BrowserWindowManager;
  const handlersMap = (ipcMain as unknown as MockIpcMainWithHandlers)._handlers;

  beforeEach(() => {
    handlersMap.clear();
    manager = new BrowserWindowManager({
      preloadPath: '/mock/preload.js',
      prodIndexPath: '/mock/index.html',
      isDev: false,
    });
  });

  it('creates and tracks the primary browser window with production index file', () => {
    const win = manager.createWindow() as unknown as MockWinInstance;

    expect(manager.hasWindow()).toBe(true);
    expect(manager.getWindow()).toBe(win as unknown as import('electron').BrowserWindow);
    expect(win.loadFile).toHaveBeenCalledWith('/mock/index.html');
  });

  it('loads dev server URL and opens DevTools when running in development mode', () => {
    const devManager = new BrowserWindowManager({
      preloadPath: '/mock/preload.js',
      prodIndexPath: '/mock/index.html',
      isDev: true,
      devServerUrl: 'http://localhost:5173',
    });

    const win = devManager.createWindow() as unknown as MockWinInstance;
    expect(win.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    expect(win.webContents.openDevTools).toHaveBeenCalledWith({ mode: 'detach' });
  });

  it('restores and focuses existing window if createWindow is called again', () => {
    const win1 = manager.createWindow() as unknown as MockWinInstance;
    win1.isMinimizedState = true;

    const win2 = manager.createWindow() as unknown as MockWinInstance;

    expect(win1).toBe(win2);
    expect(win1.restore).toHaveBeenCalled();
    expect(win1.focus).toHaveBeenCalled();
  });

  it('retrieves comprehensive window state snapshot', () => {
    manager.createWindow();
    const state = manager.getState();

    expect(state).toEqual({
      isMaximized: false,
      isMinimized: false,
      isFocused: true,
      isVisible: true,
      bounds: { x: 0, y: 0, width: 1400, height: 900 },
    });
  });

  it('toggles maximize state accurately', () => {
    const win = manager.createWindow() as unknown as MockWinInstance;

    manager.toggleMaximize();
    expect(win.maximize).toHaveBeenCalled();

    win.isMaximizedState = true;
    manager.toggleMaximize();
    expect(win.unmaximize).toHaveBeenCalled();
  });

  it('registers and unregisters window IPC channel handlers', () => {
    manager.registerIpcHandlers();

    expect(handlersMap.has('window:minimize')).toBe(true);
    expect(handlersMap.has('window:maximize')).toBe(true);
    expect(handlersMap.has('window:unmaximize')).toBe(true);
    expect(handlersMap.has('window:toggleMaximize')).toBe(true);
    expect(handlersMap.has('window:close')).toBe(true);
    expect(handlersMap.has('window:isMaximized')).toBe(true);
    expect(handlersMap.has('window:getState')).toBe(true);

    manager.unregisterIpcHandlers();

    expect(handlersMap.has('window:minimize')).toBe(false);
    expect(handlersMap.has('window:maximize')).toBe(false);
  });

  it('cleans up resources and window reference upon destroy', () => {
    const win = manager.createWindow() as unknown as MockWinInstance;
    manager.destroy();

    expect(win.destroy).toHaveBeenCalled();
    expect(manager.getWindow()).toBeNull();
    expect(manager.hasWindow()).toBe(false);
  });
});
