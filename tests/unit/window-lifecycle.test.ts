import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { attachWindowLifecycle } from '../../src/main/window/lifecycle.js';

vi.mock('electron', () => {
  return {
    shell: {
      openExternal: vi.fn().mockResolvedValue(undefined),
    },
    BrowserWindow: vi.fn(),
  };
});

import { shell } from 'electron';

class MockWebContents extends EventEmitter {
  public setWindowOpenHandlerCallback: ((details: { url: string }) => { action: string }) | null =
    null;

  public setWindowOpenHandler(fn: (details: { url: string }) => { action: string }) {
    this.setWindowOpenHandlerCallback = fn;
  }
}

class MockBrowserWindow extends EventEmitter {
  public webContents = new MockWebContents();
  public isShown = false;
  public isFocused = false;
  public destroyed = false;
  public bounds = { x: 10, y: 20, width: 1200, height: 800 };

  public show() {
    this.isShown = true;
  }

  public focus() {
    this.isFocused = true;
  }

  public isDestroyed() {
    return this.destroyed;
  }

  public getBounds() {
    return this.bounds;
  }
}

describe('Window Lifecycle Handler', () => {
  it('shows and focuses window on ready-to-show lifecycle event', () => {
    const mockWin = new MockBrowserWindow();
    const onReadyToShow = vi.fn();

    attachWindowLifecycle(mockWin as unknown as import('electron').BrowserWindow, {
      callbacks: { onReadyToShow },
      isDev: true,
    });

    mockWin.emit('ready-to-show');

    expect(mockWin.isShown).toBe(true);
    expect(mockWin.isFocused).toBe(true);
    expect(onReadyToShow).toHaveBeenCalledWith(mockWin);
  });

  it('triggers registered lifecycle callbacks for window state changes', () => {
    const mockWin = new MockBrowserWindow();
    const callbacks = {
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onMaximize: vi.fn(),
      onUnmaximize: vi.fn(),
      onMinimize: vi.fn(),
      onRestore: vi.fn(),
      onResize: vi.fn(),
      onMoved: vi.fn(),
      onClosed: vi.fn(),
      onUnresponsive: vi.fn(),
      onResponsive: vi.fn(),
    };

    attachWindowLifecycle(mockWin as unknown as import('electron').BrowserWindow, { callbacks });

    mockWin.emit('focus');
    mockWin.emit('blur');
    mockWin.emit('maximize');
    mockWin.emit('unmaximize');
    mockWin.emit('minimize');
    mockWin.emit('restore');
    mockWin.emit('resize');
    mockWin.emit('move');
    mockWin.emit('unresponsive');
    mockWin.emit('responsive');
    mockWin.emit('closed');

    expect(callbacks.onFocus).toHaveBeenCalledOnce();
    expect(callbacks.onBlur).toHaveBeenCalledOnce();
    expect(callbacks.onMaximize).toHaveBeenCalledOnce();
    expect(callbacks.onUnmaximize).toHaveBeenCalledOnce();
    expect(callbacks.onMinimize).toHaveBeenCalledOnce();
    expect(callbacks.onRestore).toHaveBeenCalledOnce();
    expect(callbacks.onResize).toHaveBeenCalledWith(mockWin.bounds);
    expect(callbacks.onMoved).toHaveBeenCalledWith(mockWin.bounds);
    expect(callbacks.onUnresponsive).toHaveBeenCalledOnce();
    expect(callbacks.onResponsive).toHaveBeenCalledOnce();
    expect(callbacks.onClosed).toHaveBeenCalledOnce();
  });

  it('notifies on render-process-gone and intercepts new window creation', () => {
    const mockWin = new MockBrowserWindow();
    const onRenderProcessGone = vi.fn();

    attachWindowLifecycle(mockWin as unknown as import('electron').BrowserWindow, {
      callbacks: { onRenderProcessGone },
    });

    const errorDetails = {
      reason: 'crashed' as const,
      exitCode: 139,
    };
    mockWin.webContents.emit('render-process-gone', {}, errorDetails);
    expect(onRenderProcessGone).toHaveBeenCalledWith(errorDetails);

    expect(mockWin.webContents.setWindowOpenHandlerCallback).toBeDefined();
    const decision = mockWin.webContents.setWindowOpenHandlerCallback!({
      url: 'https://example.com',
    });
    expect(decision).toEqual({ action: 'deny' });
    expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
  });

  it('detaches listeners when teardown function is invoked', () => {
    const mockWin = new MockBrowserWindow();
    const onFocus = vi.fn();

    const detach = attachWindowLifecycle(mockWin as unknown as import('electron').BrowserWindow, {
      callbacks: { onFocus },
    });

    detach();
    mockWin.emit('focus');
    expect(onFocus).not.toHaveBeenCalled();
  });
});
