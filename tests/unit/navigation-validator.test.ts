import { describe, expect, it } from 'vitest';
import {
  ALLOWED_NAVIGATION_PROTOCOLS,
  validateNavigationUrl,
} from '../../src/main/navigation/validator.js';

describe('Navigation Validator', () => {
  it('exposes expected allowed navigation protocol set', () => {
    expect(ALLOWED_NAVIGATION_PROTOCOLS.has('https:')).toBe(true);
    expect(ALLOWED_NAVIGATION_PROTOCOLS.has('http:')).toBe(true);
    expect(ALLOWED_NAVIGATION_PROTOCOLS.has('about:')).toBe(true);
    expect(ALLOWED_NAVIGATION_PROTOCOLS.has('javascript:')).toBe(false);
    expect(ALLOWED_NAVIGATION_PROTOCOLS.has('file:')).toBe(false);
  });

  describe('validateNavigationUrl', () => {
    it('accepts and normalizes valid standard https and http URLs', () => {
      expect(validateNavigationUrl('https://example.com')).toBe('https://example.com/');
      expect(validateNavigationUrl('http://localhost:3000/dashboard')).toBe(
        'http://localhost:3000/dashboard',
      );
      expect(validateNavigationUrl('https://github.com/ZenOska/nous-oska?tab=readme')).toBe(
        'https://github.com/ZenOska/nous-oska?tab=readme',
      );
    });

    it('accepts permitted internal about URLs', () => {
      expect(validateNavigationUrl('about:blank')).toBe('about:blank');
      expect(validateNavigationUrl('about:neterror')).toBe('about:neterror');
      expect(validateNavigationUrl('about:neterror?code=-105')).toBe('about:neterror?code=-105');
    });

    it('rejects unsupported about: URLs', () => {
      expect(() => validateNavigationUrl('about:config')).toThrow(
        'Unsupported internal about URL: about:config',
      );
      expect(() => validateNavigationUrl('about:flags')).toThrow(
        'Unsupported internal about URL: about:flags',
      );
    });

    it('rejects dangerous and local executable schemes', () => {
      expect(() => validateNavigationUrl('javascript:alert(document.cookie)')).toThrow(
        'Disallowed navigation protocol: javascript:',
      );
      expect(() => validateNavigationUrl('file:///C:/Windows/System32')).toThrow(
        'Disallowed navigation protocol: file:',
      );
      expect(() => validateNavigationUrl('data:text/html,<script>alert(1)</script>')).toThrow(
        'Disallowed navigation protocol: data:',
      );
      expect(() => validateNavigationUrl('vbscript:msgbox(1)')).toThrow(
        'Disallowed navigation protocol: vbscript:',
      );
    });

    it('rejects empty, whitespace, and non-string inputs', () => {
      expect(() => validateNavigationUrl('')).toThrow('Navigation URL must be a non-empty string');
      expect(() => validateNavigationUrl('   ')).toThrow(
        'Navigation URL must be a non-empty string',
      );
      expect(() => validateNavigationUrl(null as unknown as string)).toThrow(
        'Navigation URL must be a non-empty string',
      );
      expect(() => validateNavigationUrl(undefined as unknown as string)).toThrow(
        'Navigation URL must be a non-empty string',
      );
    });

    it('rejects malformed URLs lacking protocol structure', () => {
      expect(() => validateNavigationUrl('not-a-valid-url')).toThrow(
        'Malformed navigation URL: not-a-valid-url',
      );
      expect(() => validateNavigationUrl('://missing-scheme')).toThrow(
        'Malformed navigation URL: ://missing-scheme',
      );
    });
  });
});
