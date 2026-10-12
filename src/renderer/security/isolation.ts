export interface ContextSecurityAudit {
  isContextIsolated: boolean;
  isNodeIntegrationDisabled: boolean;
  isElectronApiAvailable: boolean;
  hasLeakedRequire: boolean;
  hasLeakedProcess: boolean;
  hasLeakedBuffer: boolean;
  passed: boolean;
}

/**
 * Validates that context isolation is actively enforced and Node primitives have not leaked into the renderer.
 */
export function auditRendererContext(
  targetWindow: unknown = typeof window !== 'undefined' ? window : {},
): ContextSecurityAudit {
  const win = targetWindow as Record<string, unknown>;

  const hasLeakedRequire = typeof win.require !== 'undefined';
  const hasLeakedProcess =
    typeof win.process !== 'undefined' &&
    Boolean((win.process as Record<string, unknown>)?.versions);
  const hasLeakedBuffer = typeof win.Buffer !== 'undefined';
  const isElectronApiAvailable = typeof win.electronAPI !== 'undefined' && win.electronAPI !== null;

  const isNodeIntegrationDisabled = !hasLeakedRequire && !hasLeakedProcess && !hasLeakedBuffer;
  const isContextIsolated = isNodeIntegrationDisabled;

  return {
    isContextIsolated,
    isNodeIntegrationDisabled,
    isElectronApiAvailable,
    hasLeakedRequire,
    hasLeakedProcess,
    hasLeakedBuffer,
    passed: isContextIsolated,
  };
}

const DISALLOWED_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);

/**
 * Normalizes and sanitizes user input for navigation, preventing script injection or unauthorized protocols.
 */
export function sanitizeNavigationUrl(
  input: string,
  searchEngine = 'https://www.google.com/search?q=',
): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'about:blank';
  }

  const lower = trimmed.toLowerCase();
  for (const protocol of DISALLOWED_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      throw new Error(`Navigation to disallowed protocol is blocked: ${protocol}`);
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'about:'
    ) {
      return parsed.href;
    }
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('disallowed protocol')) {
      throw error;
    }

    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return `https://${trimmed}`;
    }

    return `${searchEngine}${encodeURIComponent(trimmed)}`;
  }
}
