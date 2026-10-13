import type { SecurityStatus } from './types.js';
import { validateAddressInput, isLikelyUrl } from './validator.js';

export const DEFAULT_SEARCH_ENGINE = 'https://www.google.com/search?q=';

/**
 * Formats a given URL for resting presentation inside the address bar.
 */
export function formatUrlForDisplay(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'about:blank') {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'about:') {
      return trimmed;
    }

    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return `${parsed.protocol}//${parsed.host}`;
    }

    return parsed.href;
  } catch {
    return trimmed;
  }
}

/**
 * Formats a URL for active text editing when the user focuses the address bar.
 */
export function formatUrlForEditing(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'about:blank') {
    return '';
  }
  return trimmed;
}

/**
 * Converts user input into a fully qualified navigation destination URL.
 * Throws an error if the input contains disallowed protocols or malformed syntax.
 */
export function formatInputForNavigation(
  input: string,
  searchEngine = DEFAULT_SEARCH_ENGINE,
): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'about:blank') {
    return 'about:blank';
  }

  const validation = validateAddressInput(trimmed);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid address bar input.');
  }

  if (validation.isSearch) {
    return `${searchEngine}${encodeURIComponent(trimmed)}`;
  }

  // If input already has an explicit protocol
  if (trimmed.includes('://') || trimmed.startsWith('about:')) {
    const parsed = new URL(trimmed);
    return parsed.href;
  }

  // Prepend appropriate protocol if missing
  if (isLikelyUrl(trimmed)) {
    const isLocal =
      /^localhost(:\d+)?(\/.*)?$/i.test(trimmed) ||
      /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed);
    const prefix = isLocal ? 'http://' : 'https://';
    return `${prefix}${trimmed}`;
  }

  return `${searchEngine}${encodeURIComponent(trimmed)}`;
}

/**
 * Generates an informative accessibility / tooltip label based on security status.
 */
export function formatSecurityTooltip(status: SecurityStatus, currentUrl: string): string {
  switch (status) {
    case 'secure':
      return `Secure connection (HTTPS) — ${currentUrl}`;
    case 'insecure':
      return `Connection is not secure (HTTP) — ${currentUrl}`;
    case 'internal':
      return `Internal application page — ${currentUrl || 'Nous'}`;
    case 'search':
      return 'Search the web';
    case 'invalid':
      return 'Blocked or invalid address';
  }
}
