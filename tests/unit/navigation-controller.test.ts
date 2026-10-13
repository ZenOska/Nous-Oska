import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import type { WebContents } from 'electron';
import { NavigationController, type IpcMainHandler } from '../../src/main/navigation/controller.js';
import type { NavigationStateChange } from '../../src/main/navigation/types.js';

class MockWebContents extends EventEmitter {
  public url = 'about:blank';
  public title = 'New Tab';
  public isDestroyedFlag = false;

  public loadURL = vi.fn().mockImplementation((destUrl: string) => {
    this.url = destUrl;
    return Promise.resolve();
  });

  public send = vi.fn();

  public getURL() {
    return this.url;
  }

  public getTitle() {
    return this.title;
  }

  public isDestroyed() {
    return this.isDestroyedFlag;
  }

  public destroy() {
    this.isDestroyedFlag = true;
  }
}

describe('NavigationController', () => {
  let mockWebContents: MockWebContents;
  let mockIpcHandlers: Map<string, (...args: unknown[]) => unknown>;
  let customIpc: IpcMainHandler;

  beforeEach(() => {
    mockWebContents = new MockWebContents();
    mockIpcHandlers = new Map();
    customIpc = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
        mockIpcHandlers.set(channel, handler);
      }) as unknown as IpcMainHandler['handle'],
      removeHandler: vi.fn((channel: string) => {
        mockIpcHandlers.delete(channel);
      }) as unknown as IpcMainHandler['removeHandler'],
    };
  });

  it('initializes with default navigation state', () => {
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      customIpcMain: customIpc,
    });

    const state = controller.getState();
    expect(state).toEqual({
      tabId: 'default',
      isLoading: false,
      url: 'about:blank',
      title: 'New Tab',
    });
  });

  it('loads valid URLs into active WebContents and dispatches state change', async () => {
    const stateChanges: NavigationStateChange[] = [];
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      onStateChange: (state) => stateChanges.push(state),
      customIpcMain: customIpc,
    });

    await controller.loadUrl({ tabId: '1', url: 'https://example.com' });

    expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://example.com/');
    expect(mockWebContents.send).toHaveBeenCalledWith('navigation:stateChange', expect.any(Object));
    expect(stateChanges.length).toBeGreaterThan(0);
    expect(stateChanges[0].isLoading).toBe(true);
    expect(stateChanges[0].url).toBe('https://example.com/');
  });

  it('rejects disallowed navigation protocols and malformed URLs', async () => {
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      customIpcMain: customIpc,
    });

    await expect(controller.loadUrl({ tabId: '1', url: 'javascript:alert(1)' })).rejects.toThrow(
      'Disallowed navigation protocol',
    );

    await expect(controller.loadUrl({ tabId: '1', url: 'invalid-url' })).rejects.toThrow(
      'Malformed navigation URL',
    );
  });

  it('throws descriptive error if no active WebContents is available', async () => {
    const controller = new NavigationController({
      getWebContents: () => null,
      customIpcMain: customIpc,
    });

    await expect(controller.loadUrl({ tabId: '1', url: 'https://example.com' })).rejects.toThrow(
      'No active WebContents available for navigation',
    );
  });

  it('tracks WebContents did-start-loading and did-finish-load lifecycle', () => {
    const stateChanges: NavigationStateChange[] = [];
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      onStateChange: (state) => stateChanges.push(state),
      customIpcMain: customIpc,
    });

    controller.attachWebContents(mockWebContents as unknown as WebContents);

    mockWebContents.emit('did-start-loading');
    expect(stateChanges[stateChanges.length - 1].isLoading).toBe(true);

    mockWebContents.url = 'https://example.com/finished';
    mockWebContents.title = 'Finished Page';
    mockWebContents.emit('did-finish-load');

    const lastState = stateChanges[stateChanges.length - 1];
    expect(lastState.isLoading).toBe(false);
    expect(lastState.url).toBe('https://example.com/finished');
    expect(lastState.title).toBe('Finished Page');
  });

  it('updates title upon page-title-updated lifecycle events', () => {
    const stateChanges: NavigationStateChange[] = [];
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      onStateChange: (state) => stateChanges.push(state),
      customIpcMain: customIpc,
    });

    controller.attachWebContents(mockWebContents as unknown as WebContents);
    mockWebContents.emit('page-title-updated', {}, 'Updated Title');

    expect(stateChanges[stateChanges.length - 1].title).toBe('Updated Title');
  });

  it('intercepts did-fail-load and renders graceful error page without throwing raw crash', () => {
    const stateChanges: NavigationStateChange[] = [];
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      onStateChange: (state) => stateChanges.push(state),
      customIpcMain: customIpc,
    });

    controller.attachWebContents(mockWebContents as unknown as WebContents);

    mockWebContents.emit(
      'did-fail-load',
      {},
      -105,
      'ERR_NAME_NOT_RESOLVED',
      'https://missing.test',
      true,
    );

    const errorState = stateChanges[stateChanges.length - 1];
    expect(errorState.errorCode).toBe(-105);
    expect(errorState.errorDescription).toBe('ERR_NAME_NOT_RESOLVED');
    expect(errorState.url).toBe('https://missing.test');

    expect(mockWebContents.loadURL).toHaveBeenCalledWith(
      expect.stringContaining('data:text/html;charset=utf-8,'),
    );
  });

  it('ignores subframe errors and aborted navigations (-3)', () => {
    const stateChanges: NavigationStateChange[] = [];
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      onStateChange: (state) => stateChanges.push(state),
      customIpcMain: customIpc,
    });

    controller.attachWebContents(mockWebContents as unknown as WebContents);

    // Subframe failure (isMainFrame = false)
    mockWebContents.emit(
      'did-fail-load',
      {},
      -105,
      'ERR_NAME_NOT_RESOLVED',
      'https://sub.test',
      false,
    );
    expect(stateChanges.length).toBe(0);

    // Aborted navigation (-3)
    mockWebContents.emit('did-fail-load', {}, -3, 'ERR_ABORTED', 'https://abort.test', true);
    expect(stateChanges.length).toBe(0);
  });

  it('registers and unregisters IPC handlers cleanly', async () => {
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      customIpcMain: customIpc,
    });

    controller.registerIpcHandlers();
    expect(mockIpcHandlers.has('navigation:loadUrl')).toBe(true);
    expect(mockIpcHandlers.has('navigation:getState')).toBe(true);

    const loadHandler = mockIpcHandlers.get('navigation:loadUrl');
    await loadHandler?.({}, { tabId: '1', url: 'https://example.com' });
    expect(mockWebContents.loadURL).toHaveBeenCalledWith('https://example.com/');

    const getHandler = mockIpcHandlers.get('navigation:getState');
    const state = (await getHandler?.({}, '1')) as NavigationStateChange;
    expect(state.url).toBe('https://example.com/');

    controller.unregisterIpcHandlers();
    expect(mockIpcHandlers.has('navigation:loadUrl')).toBe(false);
    expect(mockIpcHandlers.has('navigation:getState')).toBe(false);
  });

  it('cleans up lifecycle listeners and IPC upon destroy', () => {
    const controller = new NavigationController({
      getWebContents: () => mockWebContents as unknown as WebContents,
      customIpcMain: customIpc,
    });

    controller.attachWebContents(mockWebContents as unknown as WebContents);
    controller.registerIpcHandlers();

    expect(mockWebContents.listenerCount('did-start-loading')).toBe(1);
    expect(mockWebContents.listenerCount('did-finish-load')).toBe(1);

    controller.destroy();

    expect(mockWebContents.listenerCount('did-start-loading')).toBe(0);
    expect(mockWebContents.listenerCount('did-finish-load')).toBe(0);
    expect(mockIpcHandlers.has('navigation:loadUrl')).toBe(false);
  });
});
