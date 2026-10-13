import type { SecurityStatus } from './types.js';

export const DISALLOWED_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);

export const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'about:']);

export interface ValidationResult {
  isValid: boolean;
  isSearch: boolean;
  securityStatus: SecurityStatus;
  error?: string;
  normalizedScheme?: string;
}

const LOCALHOST_PATTERN = /^localhost(:\d+)?(\/.*)?$/i;
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;
const DOMAIN_PATTERN = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i;

/**
 * Checks if the given raw string matches a likely web URL destination rather than a search query.
 */
export function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) {
    return false;
  }

  // If it starts with an explicit protocol
  const lower = trimmed.toLowerCase();
  for (const protocol of ALLOWED_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return true;
    }
  }

  for (const protocol of DISALLOWED_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return true;
    }
  }

  // If it contains spaces, it is a search query
  if (trimmed.includes(' ')) {
    return false;
  }

  if (LOCALHOST_PATTERN.test(trimmed)) {
    return true;
  }

  if (IPV4_PATTERN.test(trimmed)) {
    return true;
  }

  if (DOMAIN_PATTERN.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Validates the raw address bar input and returns its security classification.
 */
export function validateAddressInput(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      isValid: true,
      isSearch: false,
      securityStatus: 'internal',
      normalizedScheme: 'about:',
    };
  }

  const lower = trimmed.toLowerCase();
  for (const disallowed of DISALLOWED_PROTOCOLS) {
    if (lower.startsWith(disallowed)) {
      return {
        isValid: false,
        isSearch: false,
        securityStatus: 'invalid',
        error: `Navigation to protocol "${disallowed}" is blocked for security reasons.`,
      };
    }
  }

  // Attempt URL parse if protocol is specified
  if (lower.includes('://') || lower.startsWith('about:')) {
    try {
      const parsed = new URL(trimmed);
      if (ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        let securityStatus: SecurityStatus = 'insecure';
        if (parsed.protocol === 'https:') {
          securityStatus = 'secure';
        } else if (parsed.protocol === 'about:') {
          securityStatus = 'internal';
        }

        return {
          isValid: true,
          isSearch: false,
          securityStatus,
          normalizedScheme: parsed.protocol,
        };
      }

      return {
        isValid: false,
        isSearch: false,
        securityStatus: 'invalid',
        error: `Protocol "${parsed.protocol}" is not supported.`,
      };
    } catch {
      return {
        isValid: false,
        isSearch: false,
        securityStatus: 'invalid',
        error: 'Malformed URL structure.',
      };
    }
  }

  // Check if it's a domain/host without explicit protocol
  if (isLikelyUrl(trimmed)) {
    const isLocal = LOCALHOST_PATTERN.test(trimmed) || IPV4_PATTERN.test(trimmed);
    return {
      isValid: true,
      isSearch: false,
      securityStatus: isLocal ? 'insecure' : 'secure',
      normalizedScheme: isLocal ? 'http:' : 'https:',
    };
  }

  // Otherwise, it is treated as a valid search query
  return {
    isValid: true,
    isSearch: true,
    securityStatus: 'search',
  };
}
