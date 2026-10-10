interface Tab {
  id: number;
  title: string;
  url: string;
  favicon: string;
  webview: HTMLIFrameElement | null;
  active: boolean;
}

class BrowserApp {
  private tabs: Map<number, Tab> = new Map();
  private activeTabId: number | null = null;
  private nextTabId = 1;

  private readonly toolbar = document.getElementById('toolbar')!;
  private readonly tabBar = document.getElementById('tab-bar')!;
  private readonly newTabBtn = document.getElementById('new-tab-btn')!;
  private readonly urlBar = document.getElementById('url-bar')! as HTMLElement;
  private readonly refreshBtn = document.getElementById('refresh-btn')!;
  private readonly closeBtn = document.getElementById('close-btn')!;
  private readonly minimizeBtn = document.getElementById('minimize-btn')!;
  private readonly maximizeBtn = document.getElementById('maximize-btn')!;
  private readonly menuBtn = document.getElementById('menu-btn')!;
  private readonly searchInput = document.getElementById('search-input')! as HTMLInputElement;
  private readonly quickLinks = document.getElementById('quick-links')!;
  private readonly newTabPage = document.getElementById('new-tab-page')!;
  private readonly content = document.getElementById('content')!;

  constructor() {
    this.initEventListeners();
    this.initWindowControls();
    this.createNewTab();
    this.loadQuickLinks();
    this.checkElectronAPI();
  }

  private async checkElectronAPI(): Promise<void> {
    if (window.electronAPI) {
      try {
        const [version, name, platform] = await Promise.all([
          window.electronAPI.app.getVersion(),
          window.electronAPI.app.getName(),
          window.electronAPI.platform.get(),
        ]);
        console.log(`${name} v${version} running on ${platform}`);
      } catch (error) {
        console.error('Failed to get app info:', error);
      }
    }
  }

  private initEventListeners(): void {
    this.newTabBtn.addEventListener('click', () => this.createNewTab());
    this.refreshBtn.addEventListener('click', () => this.reloadActiveTab());
    this.urlBar.addEventListener('keydown', (e) => this.handleUrlBarKeydown(e));
    this.urlBar.addEventListener('blur', () => this.updateUrlBar());
    this.searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
  }

  private initWindowControls(): void {
    if (window.electronAPI?.window) {
      this.closeBtn.addEventListener('click', () => {
        window.electronAPI.window.close();
      });
      this.minimizeBtn.addEventListener('click', () => {
        window.electronAPI.window.minimize();
      });
      this.maximizeBtn.addEventListener('click', () => {
        window.electronAPI.window.toggleMaximize();
      });
    } else {
      this.closeBtn.addEventListener('click', () => window.close?.());
      this.minimizeBtn.style.display = 'none';
      this.maximizeBtn.style.display = 'none';
    }
  }

  private handleGlobalKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault();
      this.createNewTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault();
      this.closeActiveTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      this.reloadActiveTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
      e.preventDefault();
      this.focusUrlBar();
    }
    if (e.key === 'F11') {
      e.preventDefault();
      window.electronAPI?.shell.openExternal('electron://fullscreen');
    }
  }

  private handleUrlBarKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      const url = this.urlBar.textContent?.trim() || '';
      if (url) {
        this.navigateActiveTab(this.normalizeUrl(url));
      }
    }
    if (e.key === 'Escape') {
      this.urlBar.blur();
      this.updateUrlBar();
    }
  }

  private handleSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      const query = this.searchInput.value.trim();
      if (query) {
        this.createNewTab(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      }
    }
  }

  private normalizeUrl(input: string): string {
    try {
      const url = new URL(input);
      return url.href;
    } catch {
      if (input.includes('.') && !input.includes(' ')) {
        return `https://${input}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    }
  }

  private createNewTab(url = 'about:blank'): number {
    const id = this.nextTabId++;
    const tab: Tab = {
      id,
      title: 'New Tab',
      url,
      favicon: '',
      webview: null,
      active: false,
    };

    this.tabs.set(id, tab);
    this.renderTab(tab);
    this.switchToTab(id);

    if (url !== 'about:blank') {
      this.loadTabContent(tab, url);
    }

    return id;
  }

  private renderTab(tab: Tab): void {
    const tabEl = document.createElement('button');
    tabEl.className = `tab${tab.active ? ' active' : ''}`;
    tabEl.dataset.tabId = String(tab.id);
    tabEl.innerHTML = `
      <span class="tab-favicon" style="background: ${tab.favicon || 'var(--accent-dim)'}"></span>
      <span class="tab-title">${this.escapeHtml(tab.title)}</span>
      <button class="tab-close" title="Close tab">×</button>
    `;

    tabEl.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('tab-close')) {
        this.switchToTab(tab.id);
      }
    });

    tabEl.querySelector('.tab-close')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });

    const newTabBtn = this.tabBar.querySelector('.new-tab-btn')!;
    this.tabBar.insertBefore(tabEl, newTabBtn);
  }

  private switchToTab(id: number): void {
    const tab = this.tabs.get(id);
    if (!tab) return;

    this.tabs.forEach((t) => {
      t.active = false;
      const el = this.tabBar.querySelector(`[data-tab-id="${t.id}"]`);
      el?.classList.remove('active');
      t.webview?.style.setProperty('display', 'none');
    });

    tab.active = true;
    const activeEl = this.tabBar.querySelector(`[data-tab-id="${id}"]`);
    activeEl?.classList.add('active');

    if (tab.webview) {
      tab.webview.style.display = 'block';
      this.newTabPage.style.display = 'none';
    } else {
      this.newTabPage.style.display = 'flex';
    }

    this.activeTabId = id;
    this.updateUrlBar();
    this.updateWindowTitle();
  }

  private closeTab(id: number): void {
    const tab = this.tabs.get(id);
    if (!tab) return;

    const wasActive = tab.active;
    tab.webview?.remove();
    this.tabs.delete(id);

    const tabEl = this.tabBar.querySelector(`[data-tab-id="${id}"]`);
    tabEl?.remove();

    if (wasActive) {
      const remainingTabs = Array.from(this.tabs.values());
      if (remainingTabs.length > 0) {
        this.switchToTab(remainingTabs[remainingTabs.length - 1].id);
      } else {
        this.createNewTab();
      }
    }
  }

  private closeActiveTab(): void {
    if (this.activeTabId !== null) {
      this.closeTab(this.activeTabId);
    }
  }

  private reloadActiveTab(): void {
    if (this.activeTabId !== null) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab?.webview) {
        tab.webview.contentWindow?.location.reload();
      }
    }
  }

  private navigateActiveTab(url: string): void {
    if (this.activeTabId !== null) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab) {
        this.loadTabContent(tab, url);
      }
    }
  }

  private loadTabContent(tab: Tab, url: string): void {
    tab.url = url;

    if (tab.webview) {
      tab.webview.src = url;
      return;
    }

    const webview = document.createElement('iframe');
    webview.className = 'webview';
    webview.src = url;
    webview.sandbox =
      'allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-popups-to-escape-sandbox';
    webview.referrerPolicy = 'strict-origin-when-cross-origin';
    webview.style.display = 'block';

    webview.addEventListener('load', () => {
      try {
        const doc = webview.contentDocument || webview.contentWindow?.document;
        if (doc) {
          tab.title = doc.title || new URL(url).hostname;
          this.updateTabTitle(tab);
        }
      } catch {
        tab.title = new URL(url).hostname;
        this.updateTabTitle(tab);
      }
      this.updateUrlBar();
    });

    webview.addEventListener('error', () => {
      tab.title = 'Error loading page';
      this.updateTabTitle(tab);
    });

    this.content.appendChild(webview);
    tab.webview = webview;
    this.newTabPage.style.display = 'none';
  }

  private updateTabTitle(tab: Tab): void {
    const tabEl = this.tabBar.querySelector(`[data-tab-id="${tab.id}"]`);
    const titleEl = tabEl?.querySelector('.tab-title');
    if (titleEl) {
      titleEl.textContent = tab.title || 'New Tab';
    }
  }

  private updateUrlBar(): void {
    if (this.activeTabId !== null) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab && document.activeElement !== this.urlBar) {
        this.urlBar.textContent = tab.url === 'about:blank' ? '' : tab.url;
      }
    }
  }

  private focusUrlBar(): void {
    this.urlBar.focus();
    if (this.activeTabId !== null) {
      const tab = this.tabs.get(this.activeTabId);
      if (tab && tab.url !== 'about:blank') {
        this.urlBar.textContent = tab.url;
      }
    }
    document.execCommand('selectAll', false);
  }

  private updateWindowTitle(): void {
    if (this.activeTabId !== null) {
      const tab = this.tabs.get(this.activeTabId);
      document.title = tab ? `${tab.title} - Nous` : 'Nous';
    } else {
      document.title = 'Nous';
    }
  }

  private loadQuickLinks(): void {
    const links = [
      { title: 'GitHub', url: 'https://github.com', icon: this.githubIcon() },
      { title: 'MDN', url: 'https://developer.mozilla.org', icon: this.mdnIcon() },
      { title: 'npm', url: 'https://npmjs.com', icon: this.npmIcon() },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: this.soIcon() },
    ];

    links.forEach((link) => {
      const a = document.createElement('a');
      a.className = 'quick-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `${link.icon}<span>${link.title}</span>`;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.createNewTab(link.url);
      });
      this.quickLinks.appendChild(a);
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private githubIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`;
  }

  private mdnIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  }

  private npmIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`;
  }

  private soIcon(): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BrowserApp();
});
