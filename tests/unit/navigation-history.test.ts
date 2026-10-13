import { describe, expect, it, vi } from 'vitest';
import type { WebContents } from 'electron';
import { NavigationHistoryTracker } from '../../src/main/navigation/history.js';

describe('NavigationHistoryTracker', () => {
  const createMockWebContents = (overrides?: Partial<WebContents>): WebContents => {
    return {
      canGoBack: vi.fn().mockReturnValue(false),
      canGoForward: vi.fn().mockReturnValue(false),
      goBack: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
      ...overrides,
    } as unknown as WebContents;
  };

  describe('canGoBack', () => {
    it('returns false when webContents is null or undefined', () => {
      const tracker = new NavigationHistoryTracker();
      expect(tracker.canGoBack(null)).toBe(false);
      expect(tracker.canGoBack(undefined as unknown as WebContents)).toBe(false);
    });

    it('returns false when webContents is destroyed', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        isDestroyed: vi.fn().mockReturnValue(true),
        canGoBack: vi.fn().mockReturnValue(true),
      });

      expect(tracker.canGoBack(mockWebContents)).toBe(false);
    });

    it('returns false when webContents does not implement canGoBack', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = {} as unknown as WebContents;

      expect(tracker.canGoBack(mockWebContents)).toBe(false);
    });

    it('returns accurate boolean status from webContents', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        canGoBack: vi.fn().mockReturnValue(true),
      });

      expect(tracker.canGoBack(mockWebContents)).toBe(true);
      expect(mockWebContents.canGoBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('canGoForward', () => {
    it('returns false when webContents is null or undefined', () => {
      const tracker = new NavigationHistoryTracker();
      expect(tracker.canGoForward(null)).toBe(false);
      expect(tracker.canGoForward(undefined as unknown as WebContents)).toBe(false);
    });

    it('returns false when webContents is destroyed', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        isDestroyed: vi.fn().mockReturnValue(true),
        canGoForward: vi.fn().mockReturnValue(true),
      });

      expect(tracker.canGoForward(mockWebContents)).toBe(false);
    });

    it('returns false when webContents does not implement canGoForward', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = {} as unknown as WebContents;

      expect(tracker.canGoForward(mockWebContents)).toBe(false);
    });

    it('returns accurate boolean status from webContents', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        canGoForward: vi.fn().mockReturnValue(true),
      });

      expect(tracker.canGoForward(mockWebContents)).toBe(true);
      expect(mockWebContents.canGoForward).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCapabilities', () => {
    it('constructs complete capabilities snapshot', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        canGoBack: vi.fn().mockReturnValue(true),
        canGoForward: vi.fn().mockReturnValue(false),
      });

      const capabilities = tracker.getCapabilities(mockWebContents);
      expect(capabilities).toEqual({
        canGoBack: true,
        canGoForward: false,
      });
    });

    it('returns all false capabilities when webContents is null', () => {
      const tracker = new NavigationHistoryTracker();
      const capabilities = tracker.getCapabilities(null);
      expect(capabilities).toEqual({
        canGoBack: false,
        canGoForward: false,
      });
    });
  });

  describe('goBack', () => {
    it('enforces stack integrity and prevents pops when canGoBack is false', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        canGoBack: vi.fn().mockReturnValue(false),
        goBack: vi.fn(),
      });

      const executed = tracker.goBack(mockWebContents);
      expect(executed).toBe(false);
      expect(mockWebContents.goBack).not.toHaveBeenCalled();
    });

    it('returns false and does not throw when webContents is null', () => {
      const tracker = new NavigationHistoryTracker();
      expect(tracker.goBack(null)).toBe(false);
    });

    it('executes webContents.goBack() when preceding entries exist', () => {
      const tracker = new NavigationHistoryTracker();
      const mockWebContents = createMockWebContents({
        canGoBack: vi.fn().mockReturnValue(true),
        goBack: vi.fn(),
      });

      const executed = tracker.goBack(mockWebContents);
      expect(executed).toBe(true);
      expect(mockWebContents.goBack).toHaveBeenCalledTimes(1);
    });
  });
});
