import { describe, expect, it } from 'vitest';
import {
  auditRendererContext,
  sanitizeNavigationUrl,
} from '../../src/renderer/security/isolation.js';

describe('Renderer Security & Isolation', () => {
  it('passes audit when Node primitives are absent and electronAPI is exposed', () => {
    const mockWindow = {
      electronAPI: {},
    };

    const audit = auditRendererContext(mockWindow);
    expect(audit.passed).toBe(true);
    expect(audit.isContextIsolated).toBe(true);
    expect(audit.isNodeIntegrationDisabled).toBe(true);
    expect(audit.isElectronApiAvailable).toBe(true);
    expect(audit.hasLeakedRequire).toBe(false);
    expect(audit.hasLeakedProcess).toBe(false);
    expect(audit.hasLeakedBuffer).toBe(false);
  });

  it('fails audit when require or process leak into window', () => {
    const leakedWindow = {
      require: () => {},
      process: { versions: { node: '24.0.0' } },
      Buffer: {},
    };

    const audit = auditRendererContext(leakedWindow);
    expect(audit.passed).toBe(false);
    expect(audit.hasLeakedRequire).toBe(true);
    expect(audit.hasLeakedProcess).toBe(true);
    expect(audit.hasLeakedBuffer).toBe(true);
    expect(audit.isNodeIntegrationDisabled).toBe(false);
  });

  it('normalizes valid web addresses', () => {
    expect(sanitizeNavigationUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeNavigationUrl('http://localhost:3000')).toBe('http://localhost:3000/');
    expect(sanitizeNavigationUrl('example.com')).toBe('https://example.com');
  });

  it('transforms text search queries into search engine URLs', () => {
    const searchUrl = sanitizeNavigationUrl('hello world');
    expect(searchUrl).toBe('https://www.google.com/search?q=hello%20world');
  });

  it('blocks dangerous and script execution protocols', () => {
    expect(() => sanitizeNavigationUrl('javascript:alert(1)')).toThrow(
      'Navigation to disallowed protocol is blocked',
    );
    expect(() => sanitizeNavigationUrl('data:text/html,<h1>XSS</h1>')).toThrow(
      'Navigation to disallowed protocol is blocked',
    );
    expect(() => sanitizeNavigationUrl('file:///etc/passwd')).toThrow(
      'Navigation to disallowed protocol is blocked',
    );
  });
});
