import type { BrowserWindowConstructorOptions } from 'electron';

export const DEFAULT_WINDOW_WIDTH = 1400;
export const DEFAULT_WINDOW_HEIGHT = 900;
export const MIN_WINDOW_WIDTH = 800;
export const MIN_WINDOW_HEIGHT = 600;
export const DEFAULT_BACKGROUND_COLOR = '#0d0f12';
export const DEFAULT_TRAFFIC_LIGHT_POSITION = { x: 15, y: 15 };

export interface DisplayWorkArea {
  width: number;
  height: number;
}

export interface WindowDimensions {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

export interface BrowserWindowConfig {
  preloadPath: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  workAreaSize?: DisplayWorkArea;
  backgroundColor?: string;
  titleBarStyle?: 'hidden' | 'default' | 'hiddenInset' | 'customButtonsOnHover';
  trafficLightPosition?: { x: number; y: number };
  autoHideMenuBar?: boolean;
}

/**
 * Calculates window dimensions constrained to available screen work area.
 *
 * @param workArea Optional work area dimensions of the target display.
 * @returns Bounded window width and height alongside minimum constraints.
 */
export function calculateWindowDimensions(workArea?: DisplayWorkArea): WindowDimensions {
  if (!workArea || workArea.width <= 0 || workArea.height <= 0) {
    return {
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
      minWidth: MIN_WINDOW_WIDTH,
      minHeight: MIN_WINDOW_HEIGHT,
    };
  }

  const boundedWidth = Math.max(MIN_WINDOW_WIDTH, Math.min(DEFAULT_WINDOW_WIDTH, workArea.width));
  const boundedHeight = Math.max(
    MIN_WINDOW_HEIGHT,
    Math.min(DEFAULT_WINDOW_HEIGHT, workArea.height),
  );

  return {
    width: boundedWidth,
    height: boundedHeight,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: MIN_WINDOW_HEIGHT,
  };
}

/**
 * Constructs default BrowserWindow configuration options enforcing secure webPreferences
 * and modern frameless window styling.
 *
 * @param config Window configuration inputs.
 * @returns BrowserWindowConstructorOptions ready for Electron instantiation.
 */
export function getBrowserWindowDefaults(
  config: BrowserWindowConfig,
): BrowserWindowConstructorOptions {
  const calculated = calculateWindowDimensions(config.workAreaSize);

  return {
    width: config.width ?? calculated.width,
    height: config.height ?? calculated.height,
    minWidth: config.minWidth ?? calculated.minWidth,
    minHeight: config.minHeight ?? calculated.minHeight,
    show: false,
    backgroundColor: config.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    titleBarStyle: config.titleBarStyle ?? 'hidden',
    trafficLightPosition: config.trafficLightPosition ?? DEFAULT_TRAFFIC_LIGHT_POSITION,
    autoHideMenuBar: config.autoHideMenuBar ?? true,
    webPreferences: {
      preload: config.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      spellcheck: false,
    },
  };
}
