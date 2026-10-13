import { describe, expect, it, vi } from 'vitest';
import { WindowControls } from '../../src/renderer/window/window-controls.js';
import { RendererIpcClient } from '../../src/renderer/ipc/client.js';
import type { ElectronAPI } from '../../src/renderer/globals.js';

describe('WindowControls', () => {
  const createMockElements = () => {
    const listeners: Record<string, Record<string, () => void>> = {
      minimize: {},
      maximize: {},
      close: {},
    };

    const makeEl = (name: string) => {
      const el = {
        style: {} as Record<string, string>,
        title: '',
        attributes: {} as Record<string, string>,
        addEventListener: (event: string, cb: () => void) => {
          listeners[name][event] = cb;
        },
        setAttribute: (k: string, v: string) => {
          el.attributes[k] = v;
        },
        click: () => {
          listeners[name]['click']?.();
        },
      };
      return el;
    };

    return {
      minimizeBtn: makeEl('minimize') as unknown as HTMLElement,
      maximizeBtn: makeEl('maximize') as unknown as HTMLElement,
      closeBtn: makeEl('close') as unknown as HTMLElement,
      listeners,
    };
  };

  it('wires IPC actions when electronAPI is available', async () => {
    const mockApi: ElectronAPI = {
      app: { getVersion: vi.fn(), getName: vi.fn() },
      platform: { get: vi.fn() },
      shell: { openExternal: vi.fn() },
      window: {
        minimize: vi.fn().mockResolvedValue(undefined),
        maximize: vi.fn().mockResolvedValue(undefined),
        unmaximize: vi.fn().mockResolvedValue(undefined),
        toggleMaximize: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        isMaximized: vi.fn().mockResolvedValue(true),
        getState: vi.fn().mockResolvedValue(null),
      },
      navigation: {
        loadUrl: vi.fn().mockResolvedValue(undefined),
        getState: vi.fn().mockResolvedValue(null),
        onStateChange: vi.fn().mockReturnValue(() => undefined),
        goBack: vi.fn().mockResolvedValue(false),
        getCapabilities: vi.fn().mockResolvedValue({ canGoBack: false, canGoForward: false }),
        onCapabilitiesChange: vi.fn().mockReturnValue(() => undefined),
      },
    };

    const client = new RendererIpcClient(mockApi);
    const { minimizeBtn, maximizeBtn, closeBtn, listeners } = createMockElements();

    const controls = new WindowControls({ minimizeBtn, maximizeBtn, closeBtn }, client);
    controls.init();

    listeners.minimize.click();
    listeners.maximize.click();
    listeners.close.click();

    expect(mockApi.window.minimize).toHaveBeenCalledTimes(1);
    expect(mockApi.window.toggleMaximize).toHaveBeenCalledTimes(1);
    expect(mockApi.window.close).toHaveBeenCalledTimes(1);

    await controls.syncState();
    expect(maximizeBtn.title).toBe('Restore');
  });

  it('hides window controls gracefully when IPC is unavailable', () => {
    const client = new RendererIpcClient(undefined);
    const { minimizeBtn, maximizeBtn, closeBtn } = createMockElements();

    const controls = new WindowControls({ minimizeBtn, maximizeBtn, closeBtn }, client);
    controls.init();

    expect(minimizeBtn.style.display).toBe('none');
    expect(maximizeBtn.style.display).toBe('none');
  });
});
