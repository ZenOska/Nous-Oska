import { describe, expect, it, vi } from 'vitest';
import {
  createElectronAPI,
  validateExternalUrl,
  validateNavigationRequest,
} from '../../src/preload/api.js';

describe('Preload Bridge & Validation', () => {
  describe('validateExternalUrl', () => {
    it('accepts safe external web and mail protocols', () => {
      expect(validateExternalUrl('https://example.com')).toBe('https://example.com/');
      expect(validateExternalUrl('http://localhost:8080/test')).toBe('http://localhost:8080/test');
      expect(validateExternalUrl('mailto:support@nous.local')).toBe('mailto:support@nous.local');
    });

    it('rejects empty or non-string inputs', () => {
      expect(() => validateExternalUrl('')).toThrow('External URL must be a non-empty string');
      expect(() => validateExternalUrl('   ')).toThrow('External URL must be a non-empty string');
    });

    it('blocks dangerous and script execution protocols', () => {
      expect(() => validateExternalUrl('javascript:alert(1)')).toThrow(
        'Disallowed protocol for external navigation',
      );
      expect(() => validateExternalUrl('file:///etc/hosts')).toThrow(
        'Disallowed protocol for external navigation',
      );
      expect(() => validateExternalUrl('data:text/html;base64,PHNjcmlwdD4=')).toThrow(
        'Disallowed protocol for external navigation',
      );
    });
  });

  describe('validateNavigationRequest', () => {
    it('accepts valid navigation request objects', () => {
      const valid = { tabId: '1', url: 'https://example.com' };
      expect(validateNavigationRequest(valid)).toEqual(valid);
    });

    it('rejects invalid or non-object payloads', () => {
      expect(() =>
        validateNavigationRequest(
          null as unknown as Parameters<typeof validateNavigationRequest>[0],
        ),
      ).toThrow('Navigation request must be an object');
      expect(() =>
        validateNavigationRequest(
          'invalid' as unknown as Parameters<typeof validateNavigationRequest>[0],
        ),
      ).toThrow('Navigation request must be an object');
    });

    it('rejects missing or empty tabId and url', () => {
      expect(() => validateNavigationRequest({ tabId: '', url: 'https://example.com' })).toThrow(
        'Navigation tabId must be a non-empty string',
      );
      expect(() => validateNavigationRequest({ tabId: '1', url: '' })).toThrow(
        'Navigation URL must be a non-empty string',
      );
    });
  });

  describe('createElectronAPI', () => {
    const createMockIpc = () => ({
      invoke: vi.fn().mockImplementation((channel: string) => {
        switch (channel) {
          case 'app:getVersion':
            return Promise.resolve('0.1.0');
          case 'app:getName':
            return Promise.resolve('Nous');
          case 'platform:get':
            return Promise.resolve('linux');
          case 'window:isMaximized':
            return Promise.resolve(false);
          case 'navigation:getState':
            return Promise.resolve({
              tabId: '1',
              isLoading: false,
              url: 'https://example.com',
              title: 'Example',
            });
          default:
            return Promise.resolve(undefined);
        }
      }),
      on: vi.fn(),
      removeListener: vi.fn(),
    });

    it('creates a frozen API object and namespaces', () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      expect(Object.isFrozen(api)).toBe(true);
      expect(Object.isFrozen(api.app)).toBe(true);
      expect(Object.isFrozen(api.platform)).toBe(true);
      expect(Object.isFrozen(api.shell)).toBe(true);
      expect(Object.isFrozen(api.window)).toBe(true);
      expect(Object.isFrozen(api.navigation)).toBe(true);
    });

    it('does not expose internal ipcRenderer methods', () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc) as unknown as Record<string, unknown>;

      expect(api['send']).toBeUndefined();
      expect(api['on']).toBeUndefined();
      expect(api['addListener']).toBeUndefined();
      expect(api['ipcRenderer']).toBeUndefined();
    });

    it('dispatches app and platform channels correctly', async () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      await expect(api.app.getVersion()).resolves.toBe('0.1.0');
      await expect(api.app.getName()).resolves.toBe('Nous');
      await expect(api.platform.get()).resolves.toBe('linux');

      expect(mockIpc.invoke).toHaveBeenCalledWith('app:getVersion');
      expect(mockIpc.invoke).toHaveBeenCalledWith('app:getName');
      expect(mockIpc.invoke).toHaveBeenCalledWith('platform:get');
    });

    it('validates URLs before invoking shell:openExternal', async () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      await api.shell.openExternal('https://github.com/ZenOska/nous-oska');
      expect(mockIpc.invoke).toHaveBeenCalledWith(
        'shell:openExternal',
        'https://github.com/ZenOska/nous-oska',
      );

      expect(() => api.shell.openExternal('javascript:evil()')).toThrow(
        'Disallowed protocol for external navigation',
      );
      expect(mockIpc.invoke).not.toHaveBeenCalledWith('shell:openExternal', 'javascript:evil()');
    });

    it('dispatches all window control channels', async () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      await api.window.minimize();
      await api.window.maximize();
      await api.window.unmaximize();
      await api.window.toggleMaximize();
      await api.window.close();
      await api.window.isMaximized();
      await api.window.getState();

      expect(mockIpc.invoke).toHaveBeenCalledWith('window:minimize');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:maximize');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:unmaximize');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:toggleMaximize');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:close');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:isMaximized');
      expect(mockIpc.invoke).toHaveBeenCalledWith('window:getState');
    });

    it('dispatches navigation channels and manages state change listeners', async () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      await api.navigation.loadUrl({ tabId: '1', url: 'https://example.com' });
      expect(mockIpc.invoke).toHaveBeenCalledWith('navigation:loadUrl', {
        tabId: '1',
        url: 'https://example.com',
      });

      const state = await api.navigation.getState('1');
      expect(mockIpc.invoke).toHaveBeenCalledWith('navigation:getState', '1');
      expect(state?.url).toBe('https://example.com');

      const cb = vi.fn();
      const unsubscribe = api.navigation.onStateChange(cb);

      expect(mockIpc.on).toHaveBeenCalledWith('navigation:stateChange', expect.any(Function));
      unsubscribe();
      expect(mockIpc.removeListener).toHaveBeenCalledWith(
        'navigation:stateChange',
        expect.any(Function),
      );
    });
  });
});
