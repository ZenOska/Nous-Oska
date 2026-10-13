import { describe, expect, it, vi } from 'vitest';
import { AddressBar } from '../../src/renderer/address-bar/address-bar.js';
import type { NavigationEvent } from '../../src/renderer/address-bar/types.js';

describe('AddressBar Component', () => {
  const createMockElements = () => {
    const classList = new Set<string>();

    const makeMockElement = () => {
      const listeners: Record<string, ((e?: unknown) => void)[]> = {};
      const el = {
        tagName: 'DIV',
        value: '',
        textContent: '',
        innerHTML: '',
        title: '',
        style: {} as Record<string, string>,
        classList: {
          add: (cls: string) => classList.add(cls),
          remove: (cls: string) => classList.delete(cls),
          toggle: (cls: string, force?: boolean) => {
            const shouldAdd = force !== undefined ? force : !classList.has(cls);
            if (shouldAdd) classList.add(cls);
            else classList.delete(cls);
            return shouldAdd;
          },
          contains: (cls: string) => classList.has(cls),
        },
        setAttribute: vi.fn(),
        addEventListener: (event: string, cb: (e?: unknown) => void) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(cb);
        },
        removeEventListener: (event: string, cb: (e?: unknown) => void) => {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter((l) => l !== cb);
        },
        focus: vi.fn(() => {
          listeners['focus']?.forEach((cb) => cb());
        }),
        blur: vi.fn(() => {
          listeners['blur']?.forEach((cb) => cb());
        }),
        select: vi.fn(),
        click: () => {
          listeners['click']?.forEach((cb) => cb());
        },
        dispatchKey: (key: string) => {
          listeners['keydown']?.forEach((cb) => cb({ key, preventDefault: vi.fn() }));
        },
        dispatchInput: (newVal: string) => {
          el.textContent = newVal;
          listeners['input']?.forEach((cb) => cb());
        },
      };
      return el;
    };

    const container = makeMockElement();
    const input = makeMockElement();
    const refreshBtn = makeMockElement();
    const securityBadge = makeMockElement();

    return {
      container: container as unknown as HTMLElement,
      input: input as unknown as HTMLElement,
      refreshBtn: refreshBtn as unknown as HTMLElement,
      securityBadge: securityBadge as unknown as HTMLElement,
      mockContainer: container,
      mockInput: input,
      mockRefreshBtn: refreshBtn,
      mockSecurityBadge: securityBadge,
    };
  };

  it('initializes with default state and displays initial URL', () => {
    const { container, input, refreshBtn, securityBadge, mockInput } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
      initialUrl: 'about:blank',
    });

    expect(addressBar.getUrl()).toBe('about:blank');
    expect(mockInput.textContent).toBe('');
    expect(addressBar.getState().isValid).toBe(true);
    expect(addressBar.getState().securityStatus).toBe('internal');
  });

  it('updates input and triggers navigation on Enter', () => {
    const { container, input, refreshBtn, securityBadge, mockInput } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    const navListener = vi.fn();
    addressBar.onNavigate(navListener);

    mockInput.dispatchInput('https://github.com');
    mockInput.dispatchKey('Enter');

    expect(navListener).toHaveBeenCalledTimes(1);
    const event: NavigationEvent = navListener.mock.calls[0][0];
    expect(event.url).toBe('https://github.com/');
    expect(event.rawInput).toBe('https://github.com');
    expect(event.isSearch).toBe(false);
    expect(event.securityStatus).toBe('secure');
  });

  it('formats search input and triggers navigation', () => {
    const { container, input, refreshBtn, securityBadge, mockInput } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    const navListener = vi.fn();
    addressBar.onNavigate(navListener);

    mockInput.dispatchInput('vitest documentation');
    mockInput.dispatchKey('Enter');

    expect(navListener).toHaveBeenCalledTimes(1);
    const event: NavigationEvent = navListener.mock.calls[0][0];
    expect(event.url).toContain('https://www.google.com/search?q=vitest%20documentation');
    expect(event.isSearch).toBe(true);
  });

  it('blocks disallowed protocol on Enter and displays error state', () => {
    const { container, input, refreshBtn, securityBadge, mockInput, mockContainer } =
      createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    const navListener = vi.fn();
    addressBar.onNavigate(navListener);

    mockInput.dispatchInput('javascript:alert(1)');
    mockInput.dispatchKey('Enter');

    expect(navListener).not.toHaveBeenCalled();
    expect(mockContainer.classList.contains('invalid')).toBe(true);
    expect(addressBar.getState().isValid).toBe(false);
  });

  it('reverts text and cancels editing on Escape', () => {
    const { container, input, refreshBtn, securityBadge, mockInput } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
      initialUrl: 'https://example.com',
    });

    mockInput.focus();
    mockInput.dispatchInput('something else');
    mockInput.dispatchKey('Escape');

    expect(addressBar.getState().isEditing).toBe(false);
    expect(mockInput.textContent).toBe('https://example.com');
  });

  it('handles focus and blur lifecycle correctly', () => {
    const { container, input, refreshBtn, securityBadge, mockInput, mockContainer } =
      createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
      initialUrl: 'https://nous.dev',
    });

    mockInput.focus();
    expect(addressBar.getState().isEditing).toBe(true);
    expect(mockContainer.classList.contains('is-editing')).toBe(true);

    mockInput.blur();
    expect(addressBar.getState().isEditing).toBe(false);
    expect(mockContainer.classList.contains('is-editing')).toBe(false);
  });

  it('triggers refresh listener when refresh button is clicked', () => {
    const { container, input, refreshBtn, securityBadge, mockRefreshBtn } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    const refreshListener = vi.fn();
    addressBar.onRefresh(refreshListener);

    mockRefreshBtn.click();
    expect(refreshListener).toHaveBeenCalledTimes(1);
  });

  it('updates display when setUrl is called from outside', () => {
    const { container, input, refreshBtn, securityBadge, mockInput } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    addressBar.setUrl('https://developer.mozilla.org');
    expect(addressBar.getUrl()).toBe('https://developer.mozilla.org');
    expect(mockInput.textContent).toBe('https://developer.mozilla.org');
  });

  it('cleans up event listeners upon destroy', () => {
    const { container, input, refreshBtn, securityBadge, mockRefreshBtn } = createMockElements();
    const addressBar = new AddressBar({
      elements: { container, input, refreshBtn, securityBadge },
    });

    const refreshListener = vi.fn();
    addressBar.onRefresh(refreshListener);

    addressBar.destroy();
    mockRefreshBtn.click();
    expect(refreshListener).not.toHaveBeenCalled();
  });
});
