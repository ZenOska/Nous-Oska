/**
 * Request payload sent from renderer to initiate navigation.
 */
export interface NavigationRequest {
  tabId: string;
  url: string;
}

/**
 * State change event emitted from main process to renderer.
 */
export interface NavigationStateChange {
  tabId: string;
  isLoading: boolean;
  url: string;
  title: string;
  errorCode?: number;
  errorDescription?: string;
}

/**
 * Diagnostic mapping structure for Chromium network error codes.
 */
export interface NetErrorDetails {
  errorCode: number;
  errorDescription: string;
  userMessage: string;
  title: string;
  failedUrl: string;
}
