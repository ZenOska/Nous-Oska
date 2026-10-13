import { BrowserApp } from './app.js';

export * from './app.js';
export * from './ipc/index.js';
export * from './security/index.js';
export * from './tabs/index.js';
export * from './window/index.js';
export * from './address-bar/index.js';

export function initializeRenderer(): BrowserApp | null {
  if (typeof document === 'undefined') {
    return null;
  }
  return new BrowserApp();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeRenderer();
    });
  } else {
    initializeRenderer();
  }
}
