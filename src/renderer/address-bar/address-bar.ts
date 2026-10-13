import type {
  AddressBarElements,
  AddressBarOptions,
  AddressBarState,
  NavigationEvent,
  NavigationListener,
  RefreshListener,
  SecurityStatus,
  StateChangeListener,
} from './types.js';
import { validateAddressInput } from './validator.js';
import {
  DEFAULT_SEARCH_ENGINE,
  formatInputForNavigation,
  formatSecurityTooltip,
  formatUrlForDisplay,
  formatUrlForEditing,
} from './formatter.js';

const ICONS: Record<SecurityStatus, string> = {
  secure: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  insecure: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  internal: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  invalid: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
};

export class AddressBar {
  private readonly elements: AddressBarElements;
  private readonly searchEngine: string;

  private currentConfirmedUrl: string;
  private isEditing = false;
  private rawInput = '';
  private validationError?: string;

  private readonly navigationListeners = new Set<NavigationListener>();
  private readonly refreshListeners = new Set<RefreshListener>();
  private readonly stateChangeListeners = new Set<StateChangeListener>();

  private boundOnKeydown?: (e: KeyboardEvent) => void;
  private boundOnFocus?: () => void;
  private boundOnBlur?: () => void;
  private boundOnInput?: () => void;
  private boundOnRefreshClick?: () => void;

  constructor(options: AddressBarOptions) {
    this.elements = options.elements;
    this.searchEngine = options.defaultSearchEngine ?? DEFAULT_SEARCH_ENGINE;
    this.currentConfirmedUrl = options.initialUrl ?? 'about:blank';

    this.initEventListeners();
    this.syncUI();
  }

  private initEventListeners(): void {
    const { input, refreshBtn } = this.elements;

    if (input) {
      this.boundOnKeydown = (e: KeyboardEvent) => this.handleKeydown(e);
      this.boundOnFocus = () => this.handleFocus();
      this.boundOnBlur = () => this.handleBlur();
      this.boundOnInput = () => this.handleInput();

      input.addEventListener('keydown', this.boundOnKeydown);
      input.addEventListener('focus', this.boundOnFocus);
      input.addEventListener('blur', this.boundOnBlur);
      input.addEventListener('input', this.boundOnInput);
    }

    if (refreshBtn) {
      this.boundOnRefreshClick = () => this.triggerRefresh();
      refreshBtn.addEventListener('click', this.boundOnRefreshClick);
    }
  }

  private isInputElement(el: HTMLElement): el is HTMLInputElement {
    return (
      (typeof HTMLInputElement !== 'undefined' && el instanceof HTMLInputElement) ||
      el.tagName === 'INPUT'
    );
  }

  private readElementText(): string {
    const { input } = this.elements;
    if (!input) return '';

    if (this.isInputElement(input)) {
      return input.value;
    }
    return input.textContent ?? '';
  }

  private setElementText(text: string): void {
    const { input } = this.elements;
    if (!input) return;

    if (this.isInputElement(input)) {
      input.value = text;
    } else {
      input.textContent = text;
    }
  }

  private selectAllText(): void {
    const { input } = this.elements;
    if (!input) return;

    if (this.isInputElement(input)) {
      input.select();
      return;
    }

    if (typeof window !== 'undefined' && window.getSelection && typeof document !== 'undefined') {
      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(input);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitNavigation('enter');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cancelEditing();
    }
  }

  private handleFocus(): void {
    this.isEditing = true;
    this.validationError = undefined;

    const editUrl = formatUrlForEditing(this.currentConfirmedUrl);
    this.setElementText(editUrl);
    this.rawInput = editUrl;

    this.syncUI();
    // Microtask delay to ensure cursor/selection activates reliably
    setTimeout(() => this.selectAllText(), 0);
  }

  private handleBlur(): void {
    this.isEditing = false;
    this.validationError = undefined;

    const displayUrl = formatUrlForDisplay(this.currentConfirmedUrl);
    this.setElementText(displayUrl);
    this.rawInput = displayUrl;

    this.syncUI();
  }

  private handleInput(): void {
    this.rawInput = this.readElementText();
    const validation = validateAddressInput(this.rawInput);

    this.validationError = validation.isValid ? undefined : validation.error;
    this.syncUI();
  }

  public submitNavigation(source: 'enter' | 'action' | 'shortcut' = 'enter'): void {
    const text = this.readElementText().trim();
    if (!text) {
      this.cancelEditing();
      return;
    }

    try {
      const targetUrl = formatInputForNavigation(text, this.searchEngine);
      const validation = validateAddressInput(text);

      this.currentConfirmedUrl = targetUrl;
      this.validationError = undefined;
      this.isEditing = false;

      const navEvent: NavigationEvent = {
        url: targetUrl,
        rawInput: text,
        isSearch: validation.isSearch,
        securityStatus: validation.securityStatus,
        source,
      };

      for (const listener of this.navigationListeners) {
        listener(navEvent);
      }

      this.setElementText(formatUrlForDisplay(targetUrl));
      this.elements.input?.blur();
      this.syncUI();
    } catch (error) {
      this.validationError = error instanceof Error ? error.message : 'Invalid address format.';
      this.syncUI();
    }
  }

  public cancelEditing(): void {
    this.isEditing = false;
    this.validationError = undefined;
    this.setElementText(formatUrlForDisplay(this.currentConfirmedUrl));
    this.elements.input?.blur();
    this.syncUI();
  }

  public setUrl(url: string): void {
    this.currentConfirmedUrl = url;
    if (!this.isEditing) {
      this.setElementText(formatUrlForDisplay(url));
      this.rawInput = url;
      this.validationError = undefined;
      this.syncUI();
    }
  }

  public getUrl(): string {
    return this.currentConfirmedUrl;
  }

  public getRawText(): string {
    return this.readElementText();
  }

  public focus(): void {
    this.elements.input?.focus();
  }

  public blur(): void {
    this.elements.input?.blur();
  }

  public triggerRefresh(): void {
    for (const listener of this.refreshListeners) {
      listener();
    }
  }

  public getState(): AddressBarState {
    const validation = validateAddressInput(this.rawInput || this.currentConfirmedUrl);
    return {
      rawText: this.readElementText(),
      displayUrl: formatUrlForDisplay(this.currentConfirmedUrl),
      normalizedUrl: this.currentConfirmedUrl,
      isEditing: this.isEditing,
      isValid: !this.validationError,
      validationError: this.validationError,
      securityStatus: this.validationError ? 'invalid' : validation.securityStatus,
    };
  }

  public onNavigate(listener: NavigationListener): () => void {
    this.navigationListeners.add(listener);
    return () => this.navigationListeners.delete(listener);
  }

  public onRefresh(listener: RefreshListener): () => void {
    this.refreshListeners.add(listener);
    return () => this.refreshListeners.delete(listener);
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateChangeListeners.add(listener);
    return () => this.stateChangeListeners.delete(listener);
  }

  private syncUI(): void {
    const state = this.getState();
    const { container, securityBadge } = this.elements;

    if (container) {
      container.classList.toggle('is-editing', state.isEditing);
      container.classList.toggle('invalid', !state.isValid);
      container.classList.toggle('is-secure', state.securityStatus === 'secure');
      container.classList.toggle('is-insecure', state.securityStatus === 'insecure');
    }

    if (securityBadge) {
      securityBadge.innerHTML = ICONS[state.securityStatus];
      securityBadge.title = formatSecurityTooltip(state.securityStatus, this.currentConfirmedUrl);
      securityBadge.setAttribute(
        'aria-label',
        formatSecurityTooltip(state.securityStatus, this.currentConfirmedUrl),
      );
      securityBadge.className = `security-badge status-${state.securityStatus}`;
    }

    for (const listener of this.stateChangeListeners) {
      listener(state);
    }
  }

  public destroy(): void {
    const { input, refreshBtn } = this.elements;

    if (input) {
      if (this.boundOnKeydown) input.removeEventListener('keydown', this.boundOnKeydown);
      if (this.boundOnFocus) input.removeEventListener('focus', this.boundOnFocus);
      if (this.boundOnBlur) input.removeEventListener('blur', this.boundOnBlur);
      if (this.boundOnInput) input.removeEventListener('input', this.boundOnInput);
    }

    if (refreshBtn && this.boundOnRefreshClick) {
      refreshBtn.removeEventListener('click', this.boundOnRefreshClick);
    }

    this.navigationListeners.clear();
    this.refreshListeners.clear();
    this.stateChangeListeners.clear();
  }
}
