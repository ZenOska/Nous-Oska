import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HistoryController,
  MOUSE_BACK_BUTTON,
  MOUSE_FORWARD_BUTTON,
} from '../../src/renderer/navigation/history-controller.js';
import type { RendererIpcClient } from '../../src/renderer/ipc/client.js';

describe('HistoryController', () => {
  interface MockButton {
    disabled: boolean;
    attributes: Record<string, string>;
    classList: {
      add: (cls: string) => void;
      remove: (cls: string) => void;
      contains: (cls: string) => boolean;
    };
    listeners: Record<string, ((e?: unknown) => void)[]>;
    setAttribute: (key: string, val: string) => void;
    removeAttribute: (key: string) => void;
    addEventListener: (event: string, cb: (e?: unknown) => void) => void;
    removeEventListener: (event: string, cb: (e?: unknown) => void) => void;
    click: () => void;
  }

  const createMockButton = (): MockButton => {
    const classes = new Set<string>();
    const listeners: Record<string, ((e?: unknown) => void)[]> = {};
    const attributes: Record<string, string> = {};

    const btn: MockButton = {
      disabled: false,
      attributes,
      classList: {
        add: (cls: string) => classes.add(cls),
        remove: (cls: string) => classes.delete(cls),
        contains: (cls: string) => classes.has(cls),
      },
      listeners,
      setAttribute: (key: string, val: string) => {
        attributes[key] = val;
      },
      removeAttribute: (key: string) => {
        delete attributes[key];
      },
      addEventListener: (event: string, cb: (e?: unknown) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e?: unknown) => void) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((l) => l !== cb);
      },
      click: () => {
        listeners['click']?.forEach((cb) => cb());
      },
    };

    return btn;
  };

  const createMockIpcClient = () => {
    let capabilityListener: ((caps: { canGoBack: boolean; canGoForward: boolean }) => void) | null =
      null;
    return {
      isAvailable: vi.fn().mockReturnValue(true),
      goBack: vi.fn().mockResolvedValue(true),
      goForward: vi.fn().mockResolvedValue(true),
      getNavigationCapabilities: vi
        .fn()
        .mockResolvedValue({ canGoBack: false, canGoForward: false }),
      onCapabilitiesChange: vi.fn().mockImplementation((cb) => {
        capabilityListener = cb;
        return vi.fn(() => {
          capabilityListener = null;
        });
      }),
      emitCapabilities: (caps: { canGoBack: boolean; canGoForward: boolean }) => {
        capabilityListener?.(caps);
      },
    } as unknown as RendererIpcClient & {
      emitCapabilities: (caps: { canGoBack: boolean; canGoForward: boolean }) => void;
    };
  };

  let originalDocument: typeof globalThis.document;
  let originalWindow: typeof globalThis.window;
  let documentListeners: Record<string, ((e: unknown) => void)[]>;
  let windowListeners: Record<string, ((e: unknown) => void)[]>;

  beforeEach(() => {
    originalDocument = globalThis.document;
    originalWindow = globalThis.window;

    documentListeners = {};
    windowListeners = {};

    globalThis.document = {
      addEventListener: (event: string, cb: (e: unknown) => void) => {
        if (!documentListeners[event]) documentListeners[event] = [];
        documentListeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e: unknown) => void) => {
        if (!documentListeners[event]) return;
        documentListeners[event] = documentListeners[event].filter((l) => l !== cb);
      },
    } as unknown as Document;

    globalThis.window = {
      addEventListener: (event: string, cb: (e: unknown) => void) => {
        if (!windowListeners[event]) windowListeners[event] = [];
        windowListeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (e: unknown) => void) => {
        if (!windowListeners[event]) return;
        windowListeners[event] = windowListeners[event].filter((l) => l !== cb);
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.document = originalDocument;
    globalThis.window = originalWindow;
  });

  it('initializes back button with disabled attributes in O(1) time', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    expect(controller.getCanGoBack()).toBe(false);
    expect(mockBtn.disabled).toBe(true);
    expect(mockBtn.classList.contains('disabled')).toBe(true);
    expect(mockBtn.attributes['aria-disabled']).toBe('true');
    expect(mockBtn.attributes['disabled']).toBe('true');
  });

  it('updates visual enablement state dynamically upon capability change', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    // Enable navigation
    controller.setCapabilities({ canGoBack: true, canGoForward: false });
    expect(controller.getCanGoBack()).toBe(true);
    expect(mockBtn.disabled).toBe(false);
    expect(mockBtn.classList.contains('disabled')).toBe(false);
    expect(mockBtn.attributes['aria-disabled']).toBe('false');
    expect(mockBtn.attributes['disabled']).toBeUndefined();

    // Disable navigation
    controller.setCapabilities({ canGoBack: false, canGoForward: false });
    expect(controller.getCanGoBack()).toBe(false);
    expect(mockBtn.disabled).toBe(true);
    expect(mockBtn.classList.contains('disabled')).toBe(true);
    expect(mockBtn.attributes['aria-disabled']).toBe('true');
    expect(mockBtn.attributes['disabled']).toBe('true');
  });

  it('dispatches goBack IPC and onGoBack callback on enabled button click', async () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();
    const onGoBack = vi.fn();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
      onGoBack,
    });

    controller.setCapabilities({ canGoBack: true, canGoForward: false });
    mockBtn.click();

    expect(mockIpc.goBack).toHaveBeenCalledTimes(1);
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('ignores button clicks when canGoBack is false', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();
    const onGoBack = vi.fn();

    new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
      onGoBack,
    });

    mockBtn.click();

    expect(mockIpc.goBack).not.toHaveBeenCalled();
    expect(onGoBack).not.toHaveBeenCalled();
  });

  it('intercepts Alt+ArrowLeft and Cmd+[ keyboard shortcuts', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    controller.setCapabilities({ canGoBack: true, canGoForward: false });

    // Alt+Left
    const altLeftEvent = {
      altKey: true,
      key: 'ArrowLeft',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    const handledAlt = controller.handleKeyboardShortcut(altLeftEvent);
    expect(handledAlt).toBe(true);
    expect(altLeftEvent.preventDefault).toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(1);

    // Cmd+[
    const cmdBracketEvent = {
      metaKey: true,
      key: '[',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    const handledCmd = controller.handleKeyboardShortcut(cmdBracketEvent);
    expect(handledCmd).toBe(true);
    expect(cmdBracketEvent.preventDefault).toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(2);

    // Ctrl+[
    const ctrlBracketEvent = {
      ctrlKey: true,
      key: '[',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    const handledCtrl = controller.handleKeyboardShortcut(ctrlBracketEvent);
    expect(handledCtrl).toBe(true);
    expect(ctrlBracketEvent.preventDefault).toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(3);

    // Irrelevant key (ArrowLeft without modifier)
    const plainArrowEvent = {
      altKey: false,
      key: 'ArrowLeft',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    const handledPlain = controller.handleKeyboardShortcut(plainArrowEvent);
    expect(handledPlain).toBe(false);
    expect(plainArrowEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(3);
  });

  it('intercepts mouse back button (button 3) mouseup events', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    controller.setCapabilities({ canGoBack: true, canGoForward: false });

    const mouseBackEvent = {
      button: MOUSE_BACK_BUTTON,
      preventDefault: vi.fn(),
    };

    windowListeners['mouseup']?.forEach((cb) => cb(mouseBackEvent));
    expect(mouseBackEvent.preventDefault).toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(1);

    // Irrelevant mouse button (left click = 0)
    const mouseLeftEvent = {
      button: 0,
      preventDefault: vi.fn(),
    };
    windowListeners['mouseup']?.forEach((cb) => cb(mouseLeftEvent));
    expect(mouseLeftEvent.preventDefault).not.toHaveBeenCalled();
    expect(mockIpc.goBack).toHaveBeenCalledTimes(1);
  });

  it('synchronizes real-time capabilities from IPC stream', () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    expect(mockIpc.onCapabilitiesChange).toHaveBeenCalledTimes(1);
    expect(mockIpc.getNavigationCapabilities).toHaveBeenCalledTimes(1);

    mockIpc.emitCapabilities({ canGoBack: true, canGoForward: false });
    expect(controller.getCanGoBack()).toBe(true);
    expect(mockBtn.disabled).toBe(false);
  });

  it('dispatches goBack IPC with tabId when getTabId callback is supplied', async () => {
    const mockBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
      getTabId: () => 'tab-42',
    });

    controller.setCapabilities({ canGoBack: true, canGoForward: false });
    const executed = await controller.triggerBack();

    expect(executed).toBe(true);
    expect(mockIpc.goBack).toHaveBeenCalledWith({ tabId: 'tab-42' });
  });

  it('cleans up event listeners and IPC subscriptions upon destroy', () => {
    const mockBackBtn = createMockButton();
    const mockForwardBtn = createMockButton();
    const mockIpc = createMockIpcClient();

    const controller = new HistoryController({
      backBtn: mockBackBtn as unknown as HTMLElement,
      forwardBtn: mockForwardBtn as unknown as HTMLElement,
      ipcClient: mockIpc,
    });

    expect(mockBackBtn.listeners['click']?.length).toBe(1);
    expect(mockForwardBtn.listeners['click']?.length).toBe(1);
    expect(documentListeners['keydown']?.length).toBe(1);
    expect(windowListeners['mouseup']?.length).toBe(1);

    controller.destroy();

    expect(mockBackBtn.listeners['click']?.length).toBe(0);
    expect(mockForwardBtn.listeners['click']?.length).toBe(0);
    expect(documentListeners['keydown']?.length).toBe(0);
    expect(windowListeners['mouseup']?.length).toBe(0);
  });

  describe('Forward Navigation', () => {
    it('initializes forward button as disabled and reflects initial capabilities', () => {
      const mockForwardBtn = createMockButton();
      const controller = new HistoryController({
        forwardBtn: mockForwardBtn as unknown as HTMLElement,
      });

      expect(controller.getCanGoForward()).toBe(false);
      expect(mockForwardBtn.disabled).toBe(true);
      expect(mockForwardBtn.attributes['disabled']).toBe('true');
      expect(mockForwardBtn.attributes['aria-disabled']).toBe('true');
      expect(mockForwardBtn.classList.contains('disabled')).toBe(true);
    });

    it('enables forward button dynamically when canGoForward becomes true', () => {
      const mockForwardBtn = createMockButton();
      const controller = new HistoryController({
        forwardBtn: mockForwardBtn as unknown as HTMLElement,
      });

      controller.setCapabilities({ canGoBack: true, canGoForward: true });
      expect(controller.getCanGoForward()).toBe(true);
      expect(mockForwardBtn.disabled).toBe(false);
      expect(mockForwardBtn.attributes['disabled']).toBeUndefined();
      expect(mockForwardBtn.attributes['aria-disabled']).toBe('false');
      expect(mockForwardBtn.classList.contains('disabled')).toBe(false);

      // Disable again when session branches or advances to head
      controller.setCapabilities({ canGoBack: true, canGoForward: false });
      expect(controller.getCanGoForward()).toBe(false);
      expect(mockForwardBtn.disabled).toBe(true);
      expect(mockForwardBtn.attributes['disabled']).toBe('true');
    });

    it('suppresses triggerForward when canGoForward is false', async () => {
      const mockIpc = createMockIpcClient();
      const onForward = vi.fn();
      const controller = new HistoryController({
        ipcClient: mockIpc,
        onGoForward: onForward,
      });

      const executed = await controller.triggerForward();
      expect(executed).toBe(false);
      expect(onForward).not.toHaveBeenCalled();
      expect(mockIpc.goForward).not.toHaveBeenCalled();
    });

    it('executes triggerForward on forward button click and dispatches IPC with tabId', async () => {
      const mockForwardBtn = createMockButton();
      const mockIpc = createMockIpcClient();
      const onForward = vi.fn();

      const controller = new HistoryController({
        forwardBtn: mockForwardBtn as unknown as HTMLElement,
        ipcClient: mockIpc,
        onGoForward: onForward,
        getTabId: () => 'tab-77',
      });

      controller.setCapabilities({ canGoBack: true, canGoForward: true });

      mockForwardBtn.click();
      await vi.waitFor(() => {
        expect(mockIpc.goForward).toHaveBeenCalledWith({ tabId: 'tab-77' });
      });

      expect(onForward).toHaveBeenCalledTimes(1);
    });

    it('intercepts Alt+ArrowRight and Cmd/Ctrl+] keyboard shortcuts', () => {
      const mockForwardBtn = createMockButton();
      const mockIpc = createMockIpcClient();

      const controller = new HistoryController({
        forwardBtn: mockForwardBtn as unknown as HTMLElement,
        ipcClient: mockIpc,
      });

      controller.setCapabilities({ canGoBack: true, canGoForward: true });

      // Windows/Linux Alt+Right
      const altRightEvent = {
        altKey: true,
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      const handledAltRight = controller.handleKeyboardShortcut(altRightEvent);
      expect(handledAltRight).toBe(true);
      expect(altRightEvent.preventDefault).toHaveBeenCalled();

      // macOS Cmd+]
      const cmdBracketEvent = {
        metaKey: true,
        key: ']',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      const handledCmd = controller.handleKeyboardShortcut(cmdBracketEvent);
      expect(handledCmd).toBe(true);
      expect(cmdBracketEvent.preventDefault).toHaveBeenCalled();

      // Ctrl+]
      const ctrlBracketEvent = {
        ctrlKey: true,
        key: ']',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      const handledCtrl = controller.handleKeyboardShortcut(ctrlBracketEvent);
      expect(handledCtrl).toBe(true);
      expect(ctrlBracketEvent.preventDefault).toHaveBeenCalled();

      // Unrelated key
      const plainRightEvent = {
        altKey: false,
        key: 'ArrowRight',
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent;
      const handledPlain = controller.handleKeyboardShortcut(plainRightEvent);
      expect(handledPlain).toBe(false);
      expect(plainRightEvent.preventDefault).not.toHaveBeenCalled();

      expect(mockIpc.goForward).toHaveBeenCalledTimes(3);
    });

    it('intercepts mouse forward button (button 4) mouseup events', () => {
      const mockForwardBtn = createMockButton();
      const mockIpc = createMockIpcClient();

      const controller = new HistoryController({
        forwardBtn: mockForwardBtn as unknown as HTMLElement,
        ipcClient: mockIpc,
      });

      controller.setCapabilities({ canGoBack: true, canGoForward: true });

      const mouseForwardEvent = {
        button: MOUSE_FORWARD_BUTTON,
        preventDefault: vi.fn(),
      };

      windowListeners['mouseup']?.forEach((cb) => cb(mouseForwardEvent));
      expect(mouseForwardEvent.preventDefault).toHaveBeenCalled();
      expect(mockIpc.goForward).toHaveBeenCalledTimes(1);
    });
  });
});
