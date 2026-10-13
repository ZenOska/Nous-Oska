import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  generateNetErrorDataUrl,
  generateNetErrorHtml,
  getNetErrorDetails,
} from '../../src/main/navigation/error-page.js';

describe('Navigation Error Page Subsystem', () => {
  describe('escapeHtml', () => {
    it('escapes hazardous HTML special characters', () => {
      const raw = `<script>alert("xss" & 'test')</script>`;
      const escaped = escapeHtml(raw);
      expect(escaped).toBe(
        '&lt;script&gt;alert(&quot;xss&quot; &amp; &#39;test&#39;)&lt;/script&gt;',
      );
    });
  });

  describe('getNetErrorDetails (Error Recovery Matrix)', () => {
    it('maps ERR_NAME_NOT_RESOLVED (-105) to DNS failure diagnostics', () => {
      const details = getNetErrorDetails(-105, 'https://unknown-domain.invalid');
      expect(details.errorCode).toBe(-105);
      expect(details.errorDescription).toBe('ERR_NAME_NOT_RESOLVED');
      expect(details.userMessage).toBe('Server IP address could not be found');
      expect(details.title).toBe('Server Not Found');
      expect(details.failedUrl).toBe('https://unknown-domain.invalid');
    });

    it('maps ERR_INTERNET_DISCONNECTED (-106) to offline diagnostics', () => {
      const details = getNetErrorDetails(-106, 'https://example.com');
      expect(details.errorCode).toBe(-106);
      expect(details.errorDescription).toBe('ERR_INTERNET_DISCONNECTED');
      expect(details.userMessage).toBe('You are currently offline');
      expect(details.title).toBe('No Internet Connection');
    });

    it('maps ERR_CONNECTION_REFUSED (-102) to connection refused diagnostics', () => {
      const details = getNetErrorDetails(-102, 'http://localhost:9999');
      expect(details.errorCode).toBe(-102);
      expect(details.errorDescription).toBe('ERR_CONNECTION_REFUSED');
      expect(details.userMessage).toBe('Site refused to connect');
      expect(details.title).toBe('Connection Refused');
    });

    it('maps certificate authority / SSL errors (-200 to -299) to security warning screen', () => {
      const certDetails = getNetErrorDetails(
        -202,
        'https://expired.badssl.com',
        'ERR_CERT_DATE_INVALID',
      );
      expect(certDetails.errorCode).toBe(-202);
      expect(certDetails.errorDescription).toBe('ERR_CERT_DATE_INVALID');
      expect(certDetails.title).toBe('Security Warning');
      expect(certDetails.userMessage).toContain('certificate is invalid or untrusted');

      const certBoundary = getNetErrorDetails(-299, 'https://ssl-error.test');
      expect(certBoundary.title).toBe('Security Warning');
    });

    it('maps unknown and fallback codes gracefully', () => {
      const fallback = getNetErrorDetails(-118, 'https://slow.test', 'ERR_CONNECTION_TIMED_OUT');
      expect(fallback.errorCode).toBe(-118);
      expect(fallback.title).toBe('Unable to Connect');
      expect(fallback.userMessage).toContain('ERR_CONNECTION_TIMED_OUT');
    });
  });

  describe('generateNetErrorHtml', () => {
    it('produces clean dark-themed HTML containing essential error elements', () => {
      const details = getNetErrorDetails(-105, 'https://unknown.invalid');
      const html = generateNetErrorHtml(details);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Server Not Found - Nous');
      expect(html).toContain('Server IP address could not be found');
      expect(html).toContain('https://unknown.invalid');
      expect(html).toContain('ERR_NAME_NOT_RESOLVED (-105)');
      expect(html).toContain('onclick="window.location.reload()"');
      expect(html).toContain('--bg: #0d0f12');
    });

    it('escapes malicious inputs embedded inside URL and descriptions', () => {
      const details = getNetErrorDetails(
        -105,
        'https://evil.com/?q=<img src=x onerror=alert(1)>',
        '<script>alert(2)</script>',
      );
      const html = generateNetErrorHtml(details);

      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).not.toContain('<script>alert(2)</script>');
    });
  });

  describe('generateNetErrorDataUrl', () => {
    it('generates a valid data: URI with encoded HTML payload', () => {
      const dataUrl = generateNetErrorDataUrl('https://example.com', -106);
      expect(dataUrl.startsWith('data:text/html;charset=utf-8,')).toBe(true);

      const decoded = decodeURIComponent(dataUrl.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('You are currently offline');
      expect(decoded).toContain('ERR_INTERNET_DISCONNECTED (-106)');
    });
  });
});
