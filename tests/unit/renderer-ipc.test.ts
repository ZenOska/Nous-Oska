import { describe, expect, it, vi } from 'vitest';
import { RendererIpcClient } from '../../src/renderer/ipc/client.js';
import type { ElectronAPI } from '../../src/renderer/globals.js';

describe('RendererIpcClient', () => {
  const createMockApi = (): ElectronAPI => ({
    app: {
      getVersion: vi.fn().mockResolvedValue('0.1.0'),
      getName: vi.fn().mockResolvedValue('Nous'),
    },
    platform: {
      get: vi.fn().mockResolvedValue('win32'),
    },
    shell: {
      openExternal: vi.fn().mockResolvedValue(undefined),
    },
    window: {
      minimize: vi.fn().mockResolvedValue(undefined),
      maximize: vi.fn().mockResolvedValue(undefined),
      unmaximize: vi.fn().mockResolvedValue(undefined),
      toggleMaximize: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      isMaximized: vi.fn().mockResolvedValue(false),
      getState: vi.fn().mockResolvedValue({
        isMaximized: false,
        isMinimized: false,
        isFocused: true,
        isVisible: true,
        bounds: { x: 0, y: 0, width: 1400, height: 900 },
      }),
    },
    navigation: {
      loadUrl: vi.fn().mockResolvedValue(undefined),
      getState: vi.fn().mockResolvedValue({
        tabId: '1',
        isLoading: false,
        url: 'https://example.com',
        title: 'Example',
      }),
      onStateChange: vi.fn().mockReturnValue(() => undefined),
    },
  });

  it('detects availability of electronAPI accurately', () => {
    const activeClient = new RendererIpcClient(createMockApi());
    expect(activeClient.isAvailable()).toBe(true);

    const inactiveClient = new RendererIpcClient(undefined);
    expect(inactiveClient.isAvailable()).toBe(false);
  });

  it('throws descriptive error if calling IPC when bridge is missing', async () => {
    const inactiveClient = new RendererIpcClient(undefined);
    await expect(inactiveClient.getAppVersion()).rejects.toThrow(
      'Electron IPC bridge is not available in the current context',
    );
  });

  it('delegates app and platform queries to electronAPI', async () => {
    const mockApi = createMockApi();
    const client = new RendererIpcClient(mockApi);

    await expect(client.getAppVersion()).resolves.toBe('0.1.0');
    await expect(client.getAppName()).resolves.toBe('Nous');
    await expect(client.getPlatform()).resolves.toBe('win32');

    expect(mockApi.app.getVersion).toHaveBeenCalledTimes(1);
    expect(mockApi.app.getName).toHaveBeenCalledTimes(1);
    expect(mockApi.platform.get).toHaveBeenCalledTimes(1);
  });

  it('delegates window actions across the bridge', async () => {
    const mockApi = createMockApi();
    const client = new RendererIpcClient(mockApi);

    await client.minimizeWindow();
    await client.maximizeWindow();
    await client.unmaximizeWindow();
    await client.toggleMaximizeWindow();
    await client.closeWindow();
    const isMax = await client.isWindowMaximized();
    const state = await client.getWindowState();

    expect(mockApi.window.minimize).toHaveBeenCalled();
    expect(mockApi.window.maximize).toHaveBeenCalled();
    expect(mockApi.window.unmaximize).toHaveBeenCalled();
    expect(mockApi.window.toggleMaximize).toHaveBeenCalled();
    expect(mockApi.window.close).toHaveBeenCalled();
    expect(isMax).toBe(false);
    expect(state?.bounds.width).toBe(1400);
  });

  it('validates allowed schemes before delegating openExternal', async () => {
    const mockApi = createMockApi();
    const client = new RendererIpcClient(mockApi);

    await client.openExternal('https://example.com');
    expect(mockApi.shell.openExternal).toHaveBeenCalledWith('https://example.com');

    await expect(client.openExternal('file:///C:/secret.txt')).rejects.toThrow(
      'Disallowed protocol for external navigation',
    );
    await expect(client.openExternal('javascript:alert(1)')).rejects.toThrow();
  });

  it('delegates navigation operations across the bridge', async () => {
    const mockApi = createMockApi();
    const client = new RendererIpcClient(mockApi);

    await client.loadUrl({ tabId: '1', url: 'https://example.com' });
    expect(mockApi.navigation.loadUrl).toHaveBeenCalledWith({
      tabId: '1',
      url: 'https://example.com',
    });

    const state = await client.getNavigationState('1');
    expect(mockApi.navigation.getState).toHaveBeenCalledWith('1');
    expect(state?.url).toBe('https://example.com');

    const cb = vi.fn();
    client.onNavigationStateChange(cb);
    expect(mockApi.navigation.onStateChange).toHaveBeenCalledWith(cb);
  });
});
