import type { NetErrorDetails } from './types.js';

export const ERR_NAME_NOT_RESOLVED = -105;
export const ERR_INTERNET_DISCONNECTED = -106;
export const ERR_CONNECTION_REFUSED = -102;
export const CERT_ERROR_MIN = -299;
export const CERT_ERROR_MAX = -200;

/**
 * Escapes unsafe HTML characters to prevent cross-site scripting in error pages.
 *
 * @param str Raw unescaped string.
 * @returns Escaped safe HTML string.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Maps Chromium net error codes to human-readable diagnostic messages.
 *
 * @param errorCode Numeric Chromium error code.
 * @param failedUrl Destination URL that failed to load.
 * @param defaultDesc Optional technical error description provided by Chromium.
 * @returns NetErrorDetails structure with user-friendly diagnostics.
 */
export function getNetErrorDetails(
  errorCode: number,
  failedUrl: string,
  defaultDesc?: string,
): NetErrorDetails {
  if (errorCode === ERR_NAME_NOT_RESOLVED) {
    return {
      errorCode,
      errorDescription: 'ERR_NAME_NOT_RESOLVED',
      title: 'Server Not Found',
      userMessage: 'Server IP address could not be found',
      failedUrl,
    };
  }

  if (errorCode === ERR_INTERNET_DISCONNECTED) {
    return {
      errorCode,
      errorDescription: 'ERR_INTERNET_DISCONNECTED',
      title: 'No Internet Connection',
      userMessage: 'You are currently offline',
      failedUrl,
    };
  }

  if (errorCode === ERR_CONNECTION_REFUSED) {
    return {
      errorCode,
      errorDescription: 'ERR_CONNECTION_REFUSED',
      title: 'Connection Refused',
      userMessage: 'Site refused to connect',
      failedUrl,
    };
  }

  if (errorCode >= CERT_ERROR_MIN && errorCode <= CERT_ERROR_MAX) {
    return {
      errorCode,
      errorDescription: defaultDesc || 'ERR_CERT_COMMON_NAME_INVALID',
      title: 'Security Warning',
      userMessage:
        'A secure connection could not be established because the site certificate is invalid or untrusted',
      failedUrl,
    };
  }

  return {
    errorCode,
    errorDescription: defaultDesc || 'ERR_NETWORK_ERROR',
    title: 'Unable to Connect',
    userMessage: defaultDesc
      ? `Network error encountered: ${defaultDesc}`
      : 'An unexpected network error occurred',
    failedUrl,
  };
}

/**
 * Generates an accessible, dark-themed error page HTML string.
 *
 * @param details Net error diagnostic details.
 * @returns Self-contained HTML string with inline styling and retry controls.
 */
export function generateNetErrorHtml(details: NetErrorDetails): string {
  const safeTitle = escapeHtml(details.title);
  const safeMessage = escapeHtml(details.userMessage);
  const safeUrl = escapeHtml(details.failedUrl);
  const safeCode = escapeHtml(details.errorDescription);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} - Nous</title>
  <style>
    :root {
      --bg: #0d0f12;
      --card-bg: #16191f;
      --text-main: #f0f6fc;
      --text-muted: #8b949e;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --border: #30363d;
      --danger: #ef4444;
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: var(--font-family);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px;
      max-width: 580px;
      width: 100%;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
    }
    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    p.message {
      font-size: 15px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .url-chip {
      display: inline-block;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      color: var(--text-main);
      margin-bottom: 24px;
    }
    .suggestions {
      background: rgba(255, 255, 255, 0.02);
      border-left: 3px solid var(--accent);
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 28px;
    }
    .suggestions h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    .suggestions ul {
      list-style-type: disc;
      padding-left: 18px;
      font-size: 13px;
      color: var(--text-muted);
    }
    .suggestions li {
      margin-bottom: 4px;
    }
    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 8px;
    }
    .btn-retry {
      background: var(--accent);
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-retry:hover {
      background: var(--accent-hover);
    }
    .error-code {
      font-size: 12px;
      color: var(--text-muted);
      font-family: monospace;
    }
  </style>
</head>
<body>
  <main class="card" role="alert">
    <div class="icon-wrapper" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h1>${safeTitle}</h1>
    <p class="message">${safeMessage}</p>
    <div>
      <span class="url-chip" title="${safeUrl}">${safeUrl}</span>
    </div>
    <div class="suggestions">
      <h2>Troubleshooting suggestions:</h2>
      <ul>
        <li>Check your internet connection and cables</li>
        <li>Verify DNS and firewall configurations</li>
        <li>Ensure the destination address is spelled correctly</li>
      </ul>
    </div>
    <footer class="actions">
      <button class="btn-retry" id="retry-btn" onclick="window.location.reload()">Try Again</button>
      <span class="error-code">${safeCode} (${details.errorCode})</span>
    </footer>
  </main>
</body>
</html>`;
}

/**
 * Returns a data: URI representation of the net error page for direct WebContents loading.
 *
 * @param failedUrl Destination URL that failed to load.
 * @param errorCode Numeric error code.
 * @param errorDescription Optional technical error description.
 * @returns Fully encoded data URI string.
 */
export function generateNetErrorDataUrl(
  failedUrl: string,
  errorCode: number,
  errorDescription?: string,
): string {
  const details = getNetErrorDetails(errorCode, failedUrl, errorDescription);
  const html = generateNetErrorHtml(details);
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}
