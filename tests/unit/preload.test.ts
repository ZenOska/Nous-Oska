import { describe, expect, it, vi } from 'vitest';
import { createElectronAPI, validateExternalUrl } from '../../src/preload/api.js';

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
          default:
            return Promise.resolve(undefined);
        }
      }),
    });

    it('creates a frozen API object and namespaces', () => {
      const mockIpc = createMockIpc();
      const api = createElectronAPI(mockIpc);

      expect(Object.isFrozen(api)).toBe(true);
      expect(Object.isFrozen(api.app)).toBe(true);
      expect(Object.isFrozen(api.platform)).toBe(true);
      expect(Object.isFrozen(api.shell)).toBe(true);
      expect(Object.isFrozen(api.window)).toBe(true);
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
  });
});
