import { BrowserWindow, shell, type Rectangle, type RenderProcessGoneDetails } from 'electron';

export interface WindowLifecycleCallbacks {
  onReadyToShow?: (window: BrowserWindow) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMaximize?: () => void;
  onUnmaximize?: () => void;
  onMinimize?: () => void;
  onRestore?: () => void;
  onResize?: (bounds: Rectangle) => void;
  onMoved?: (bounds: Rectangle) => void;
  onUnresponsive?: () => void;
  onResponsive?: () => void;
  onRenderProcessGone?: (details: RenderProcessGoneDetails) => void;
  onClosed?: () => void;
}

export interface LifecycleOptions {
  callbacks?: WindowLifecycleCallbacks;
  isDev?: boolean;
}

/**
 * Attaches event listeners for the browser window lifecycle, renderer process health,
 * and security-hardened navigation containment.
 *
 * @param window The target BrowserWindow instance.
 * @param options Configuration for lifecycle callbacks and environment flags.
 * @returns A teardown function to cleanly unsubscribe all attached listeners.
 */
export function attachWindowLifecycle(
  window: BrowserWindow,
  options: LifecycleOptions = {},
): () => void {
  const { callbacks, isDev = false } = options;

  const handleReadyToShow = () => {
    window.show();
    if (isDev) {
      window.focus();
    }
    callbacks?.onReadyToShow?.(window);
  };

  const handleFocus = () => callbacks?.onFocus?.();
  const handleBlur = () => callbacks?.onBlur?.();
  const handleMaximize = () => callbacks?.onMaximize?.();
  const handleUnmaximize = () => callbacks?.onUnmaximize?.();
  const handleMinimize = () => callbacks?.onMinimize?.();
  const handleRestore = () => callbacks?.onRestore?.();

  const handleResize = () => {
    if (!window.isDestroyed()) {
      callbacks?.onResize?.(window.getBounds());
    }
  };

  const handleMoved = () => {
    if (!window.isDestroyed()) {
      callbacks?.onMoved?.(window.getBounds());
    }
  };

  const handleUnresponsive = () => {
    console.warn('[WindowLifecycle] Browser window became unresponsive');
    callbacks?.onUnresponsive?.();
  };

  const handleResponsive = () => {
    console.info('[WindowLifecycle] Browser window recovered and is responsive');
    callbacks?.onResponsive?.();
  };

  const handleClosed = () => {
    callbacks?.onClosed?.();
  };

  const handleRenderProcessGone = (_event: Electron.Event, details: RenderProcessGoneDetails) => {
    console.error(
      `[WindowLifecycle] Renderer process terminated: reason=${details.reason}, exitCode=${details.exitCode}`,
    );
    callbacks?.onRenderProcessGone?.(details);
  };

  // Attach window event listeners
  window.once('ready-to-show', handleReadyToShow);
  window.on('focus', handleFocus);
  window.on('blur', handleBlur);
  window.on('maximize', handleMaximize);
  window.on('unmaximize', handleUnmaximize);
  window.on('minimize', handleMinimize);
  window.on('restore', handleRestore);
  window.on('resize', handleResize);
  window.on('move', handleMoved);
  window.on('unresponsive', handleUnresponsive);
  window.on('responsive', handleResponsive);
  window.on('closed', handleClosed);

  // Attach webContents lifecycle listeners
  window.webContents.on('render-process-gone', handleRenderProcessGone);

  // Enforce security perimeter for window navigation & popup requests
  window.webContents.setWindowOpenHandler(({ url: requestedUrl }) => {
    shell.openExternal(requestedUrl).catch((error) => {
      console.error('[WindowLifecycle] Failed to open external URL:', error);
    });
    return { action: 'deny' };
  });

  return () => {
    window.removeListener('ready-to-show', handleReadyToShow);
    window.removeListener('focus', handleFocus);
    window.removeListener('blur', handleBlur);
    window.removeListener('maximize', handleMaximize);
    window.removeListener('unmaximize', handleUnmaximize);
    window.removeListener('minimize', handleMinimize);
    window.removeListener('restore', handleRestore);
    window.removeListener('resize', handleResize);
    window.removeListener('move', handleMoved);
    window.removeListener('unresponsive', handleUnresponsive);
    window.removeListener('responsive', handleResponsive);
    window.removeListener('closed', handleClosed);

    if (!window.isDestroyed()) {
      window.webContents.removeListener('render-process-gone', handleRenderProcessGone);
    }
  };
}
