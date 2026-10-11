import { describe, expect, it } from 'vitest';
import {
  calculateWindowDimensions,
  getBrowserWindowDefaults,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TRAFFIC_LIGHT_POSITION,
} from '../../src/main/window/config.js';

describe('Window Configuration & Dimensions', () => {
  describe('calculateWindowDimensions', () => {
    it('returns default dimensions when no display workArea is provided', () => {
      const dimensions = calculateWindowDimensions();
      expect(dimensions).toEqual({
        width: DEFAULT_WINDOW_WIDTH,
        height: DEFAULT_WINDOW_HEIGHT,
        minWidth: MIN_WINDOW_WIDTH,
        minHeight: MIN_WINDOW_HEIGHT,
      });
    });

    it('returns default dimensions when display workArea has non-positive dimensions', () => {
      const dimensions = calculateWindowDimensions({ width: 0, height: 0 });
      expect(dimensions.width).toBe(DEFAULT_WINDOW_WIDTH);
      expect(dimensions.height).toBe(DEFAULT_WINDOW_HEIGHT);
    });

    it('caps window dimensions to default size on large displays', () => {
      const dimensions = calculateWindowDimensions({ width: 2560, height: 1440 });
      expect(dimensions.width).toBe(DEFAULT_WINDOW_WIDTH);
      expect(dimensions.height).toBe(DEFAULT_WINDOW_HEIGHT);
    });

    it('scales dimensions down to fit displays smaller than the default size', () => {
      const dimensions = calculateWindowDimensions({ width: 1200, height: 750 });
      expect(dimensions.width).toBe(1200);
      expect(dimensions.height).toBe(750);
      expect(dimensions.minWidth).toBe(MIN_WINDOW_WIDTH);
      expect(dimensions.minHeight).toBe(MIN_WINDOW_HEIGHT);
    });

    it('enforces minimum dimensions even on small displays', () => {
      const dimensions = calculateWindowDimensions({ width: 640, height: 480 });
      expect(dimensions.width).toBe(MIN_WINDOW_WIDTH);
      expect(dimensions.height).toBe(MIN_WINDOW_HEIGHT);
    });
  });

  describe('getBrowserWindowDefaults', () => {
    const fakePreloadPath = '/path/to/preload.js';

    it('generates standard BrowserWindow options with required security webPreferences', () => {
      const options = getBrowserWindowDefaults({ preloadPath: fakePreloadPath });

      expect(options.show).toBe(false);
      expect(options.backgroundColor).toBe(DEFAULT_BACKGROUND_COLOR);
      expect(options.titleBarStyle).toBe('hidden');
      expect(options.trafficLightPosition).toEqual(DEFAULT_TRAFFIC_LIGHT_POSITION);
      expect(options.autoHideMenuBar).toBe(true);
      expect(options.minWidth).toBe(MIN_WINDOW_WIDTH);
      expect(options.minHeight).toBe(MIN_WINDOW_HEIGHT);

      expect(options.webPreferences).toEqual({
        preload: fakePreloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        spellcheck: false,
      });
    });

    it('supports custom dimension and appearance overrides', () => {
      const options = getBrowserWindowDefaults({
        preloadPath: fakePreloadPath,
        width: 1000,
        height: 700,
        backgroundColor: '#112233',
        titleBarStyle: 'default',
        trafficLightPosition: { x: 20, y: 20 },
        autoHideMenuBar: false,
      });

      expect(options.width).toBe(1000);
      expect(options.height).toBe(700);
      expect(options.backgroundColor).toBe('#112233');
      expect(options.titleBarStyle).toBe('default');
      expect(options.trafficLightPosition).toEqual({ x: 20, y: 20 });
      expect(options.autoHideMenuBar).toBe(false);
    });
  });
});
