export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFocused: boolean;
  isVisible: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NavigationRequest {
  tabId: string;
  url: string;
}

export interface NavigationStateChange {
  tabId: string;
  isLoading: boolean;
  url: string;
  title: string;
  errorCode?: number;
  errorDescription?: string;
}

export interface NavigationHistoryAction {
  tabId: string;
}

export interface NavigationCapabilities {
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
  };
  platform: {
    get: () => Promise<string>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    unmaximize: () => Promise<void>;
    toggleMaximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    getState: () => Promise<WindowState | null>;
  };
  navigation: {
    loadUrl: (request: NavigationRequest) => Promise<void>;
    getState: (tabId?: string) => Promise<NavigationStateChange | null>;
    onStateChange: (callback: (state: NavigationStateChange) => void) => () => void;
    goBack: (action?: NavigationHistoryAction) => Promise<boolean>;
    goForward: (action?: NavigationHistoryAction) => Promise<boolean>;
    getCapabilities: (tabId?: string) => Promise<NavigationCapabilities>;
    onCapabilitiesChange: (callback: (capabilities: NavigationCapabilities) => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    close?: () => void;
  }
}

export {};
