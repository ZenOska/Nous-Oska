export type SecurityStatus = 'secure' | 'insecure' | 'internal' | 'search' | 'invalid';

export interface AddressBarState {
  rawText: string;
  displayUrl: string;
  normalizedUrl: string;
  isEditing: boolean;
  isValid: boolean;
  validationError?: string;
  securityStatus: SecurityStatus;
}

export interface NavigationEvent {
  url: string;
  rawInput: string;
  isSearch: boolean;
  securityStatus: SecurityStatus;
  source: 'enter' | 'action' | 'shortcut';
}

export type NavigationListener = (event: NavigationEvent) => void;
export type RefreshListener = () => void;
export type StateChangeListener = (state: AddressBarState) => void;

export interface AddressBarElements {
  container: HTMLElement | null;
  input: HTMLElement | null;
  refreshBtn?: HTMLElement | null;
  securityBadge?: HTMLElement | null;
}

export interface AddressBarOptions {
  elements: AddressBarElements;
  defaultSearchEngine?: string;
  initialUrl?: string;
}
