import { describe, expect, it } from 'vitest';
import {
  isLikelyUrl,
  validateAddressInput,
  DISALLOWED_PROTOCOLS,
} from '../../src/renderer/address-bar/validator.js';

describe('Address Bar Validator', () => {
  describe('isLikelyUrl', () => {
    it('detects explicit URLs with valid protocols', () => {
      expect(isLikelyUrl('https://example.com')).toBe(true);
      expect(isLikelyUrl('http://insecure.site')).toBe(true);
      expect(isLikelyUrl('about:blank')).toBe(true);
    });

    it('identifies localhost and IPv4 addresses', () => {
      expect(isLikelyUrl('localhost')).toBe(true);
      expect(isLikelyUrl('localhost:3000')).toBe(true);
      expect(isLikelyUrl('127.0.0.1')).toBe(true);
      expect(isLikelyUrl('192.168.1.1:8080/dashboard')).toBe(true);
    });

    it('identifies standard web domains', () => {
      expect(isLikelyUrl('google.com')).toBe(true);
      expect(isLikelyUrl('github.com/ZenOska/nous-oska')).toBe(true);
      expect(isLikelyUrl('sub.domain.co.uk')).toBe(true);
    });

    it('rejects multi-word search queries and plain text', () => {
      expect(isLikelyUrl('what is electron')).toBe(false);
      expect(isLikelyUrl('nous browser')).toBe(false);
      expect(isLikelyUrl('singleword')).toBe(false);
      expect(isLikelyUrl('')).toBe(false);
    });
  });

  describe('validateAddressInput', () => {
    it('handles empty input gracefully as internal about:blank', () => {
      const result = validateAddressInput('');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('internal');
    });

    it('blocks dangerous and script execution protocols', () => {
      for (const disallowed of DISALLOWED_PROTOCOLS) {
        const result = validateAddressInput(`${disallowed}alert(1)`);
        expect(result.isValid).toBe(false);
        expect(result.securityStatus).toBe('invalid');
        expect(result.error).toContain('blocked for security reasons');
      }
    });

    it('classifies explicit HTTPS as secure', () => {
      const result = validateAddressInput('https://nous.dev/docs');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('secure');
      expect(result.normalizedScheme).toBe('https:');
    });

    it('classifies explicit HTTP as insecure', () => {
      const result = validateAddressInput('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('insecure');
      expect(result.normalizedScheme).toBe('http:');
    });

    it('classifies internal about: pages as internal', () => {
      const result = validateAddressInput('about:blank');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('internal');
    });

    it('flags unsupported schemes as invalid', () => {
      const result = validateAddressInput('ftp://ftp.is.co.za');
      expect(result.isValid).toBe(false);
      expect(result.securityStatus).toBe('invalid');
      expect(result.error).toContain('is not supported');
    });

    it('identifies plain web domains and assigns secure default', () => {
      const result = validateAddressInput('github.com');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('secure');
      expect(result.normalizedScheme).toBe('https:');
    });

    it('identifies localhost as insecure HTTP default', () => {
      const result = validateAddressInput('localhost:5173');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(false);
      expect(result.securityStatus).toBe('insecure');
      expect(result.normalizedScheme).toBe('http:');
    });

    it('treats text queries as valid search requests', () => {
      const result = validateAddressInput('typescript tutorial');
      expect(result.isValid).toBe(true);
      expect(result.isSearch).toBe(true);
      expect(result.securityStatus).toBe('search');
    });
  });
});
