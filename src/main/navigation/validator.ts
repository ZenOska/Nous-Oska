/**
 * Set of allowed navigation protocol schemes.
 */
export const ALLOWED_NAVIGATION_PROTOCOLS = new Set(['https:', 'http:', 'about:']);

/**
 * Permitted internal `about:` path prefixes.
 */
export const ALLOWED_ABOUT_PREFIXES = ['about:blank', 'about:neterror'];

/**
 * Validates and normalizes candidate navigation URLs before dispatching to webContents.
 *
 * @param url Candidate URL string requested for navigation.
 * @returns Fully validated and normalized URL string.
 * @throws Error if the URL is empty, non-string, malformed, or utilizes a disallowed protocol.
 */
export function validateNavigationUrl(url: string): string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('Navigation URL must be a non-empty string');
  }

  const trimmed = url.trim();

  // Validate internal about: schemes
  if (trimmed.startsWith('about:')) {
    const isAllowedAbout = ALLOWED_ABOUT_PREFIXES.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}?`),
    );
    if (!isAllowedAbout) {
      throw new Error(`Unsupported internal about URL: ${trimmed}`);
    }
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Malformed navigation URL: ${trimmed}`);
  }

  if (!ALLOWED_NAVIGATION_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Disallowed navigation protocol: ${parsed.protocol}`);
  }

  return parsed.href;
}
