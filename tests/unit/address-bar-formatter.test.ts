import { describe, expect, it } from 'vitest';
import {
  formatInputForNavigation,
  formatSecurityTooltip,
  formatUrlForDisplay,
  formatUrlForEditing,
  DEFAULT_SEARCH_ENGINE,
} from '../../src/renderer/address-bar/formatter.js';

describe('Address Bar Formatter', () => {
  describe('formatUrlForDisplay', () => {
    it('returns empty string for about:blank and empty values', () => {
      expect(formatUrlForDisplay('about:blank')).toBe('');
      expect(formatUrlForDisplay('')).toBe('');
      expect(formatUrlForDisplay('   ')).toBe('');
    });

    it('formats valid URLs for display', () => {
      expect(formatUrlForDisplay('https://github.com/ZenOska/nous-oska')).toBe(
        'https://github.com/ZenOska/nous-oska',
      );
    });
  });

  describe('formatUrlForEditing', () => {
    it('returns empty string for about:blank', () => {
      expect(formatUrlForEditing('about:blank')).toBe('');
      expect(formatUrlForEditing('')).toBe('');
    });

    it('preserves full URL when editing', () => {
      expect(formatUrlForEditing('https://example.com/test?q=1')).toBe(
        'https://example.com/test?q=1',
      );
    });
  });

  describe('formatInputForNavigation', () => {
    it('returns about:blank for empty inputs', () => {
      expect(formatInputForNavigation('')).toBe('about:blank');
      expect(formatInputForNavigation('about:blank')).toBe('about:blank');
    });

    it('prepends https:// to domain names without scheme', () => {
      expect(formatInputForNavigation('github.com')).toBe('https://github.com');
      expect(formatInputForNavigation('sub.example.com/page')).toBe('https://sub.example.com/page');
    });

    it('prepends http:// to localhost and IP addresses', () => {
      expect(formatInputForNavigation('localhost:3000')).toBe('http://localhost:3000');
      expect(formatInputForNavigation('127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
    });

    it('retains valid explicit protocols', () => {
      expect(formatInputForNavigation('https://duckduckgo.com/')).toBe('https://duckduckgo.com/');
      expect(formatInputForNavigation('http://insecure.test')).toBe('http://insecure.test/');
    });

    it('formats search queries using the search engine', () => {
      expect(formatInputForNavigation('electron browser shell')).toBe(
        `${DEFAULT_SEARCH_ENGINE}electron%20browser%20shell`,
      );
    });

    it('throws error for disallowed or dangerous protocols', () => {
      expect(() => formatInputForNavigation('javascript:alert(1)')).toThrow(
        'blocked for security reasons',
      );
      expect(() => formatInputForNavigation('data:text/html,test')).toThrow(
        'blocked for security reasons',
      );
      expect(() => formatInputForNavigation('file:///etc/passwd')).toThrow(
        'blocked for security reasons',
      );
    });
  });

  describe('formatSecurityTooltip', () => {
    it('generates informative status tooltips', () => {
      expect(formatSecurityTooltip('secure', 'https://nous.dev')).toContain('Secure connection');
      expect(formatSecurityTooltip('insecure', 'http://nous.dev')).toContain('not secure');
      expect(formatSecurityTooltip('internal', 'about:blank')).toContain('Internal');
      expect(formatSecurityTooltip('search', '')).toContain('Search the web');
      expect(formatSecurityTooltip('invalid', 'javascript:evil()')).toContain('Blocked');
    });
  });
});
