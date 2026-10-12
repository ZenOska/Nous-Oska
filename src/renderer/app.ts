import { RendererIpcClient } from './ipc/index.js';
import { auditRendererContext, sanitizeNavigationUrl } from './security/index.js';
import { TabManager } from './tabs/index.js';
import type { Tab } from './tabs/types.js';
import { WindowControls } from './window/index.js';

export class BrowserApp {
  public readonly ipcClient: RendererIpcClient;
  public readonly tabManager: TabManager;
  public readonly windowControls: WindowControls;

  private readonly iframes: Map<number, HTMLIFrameElement> = new Map();

  private readonly tabBar = document.getElementById('tab-bar');
  private readonly newTabBtn = document.getElementById('new-tab-btn');
  private readonly urlBar = document.getElementById('url-bar') as HTMLElement | null;
  private readonly refreshBtn = document.getElementById('refresh-btn');
  private readonly closeBtn = document.getElementById('close-btn');
  private readonly minimizeBtn = document.getElementById('minimize-btn');
  private readonly maximizeBtn = document.getElementById('maximize-btn');
  private readonly searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  private readonly quickLinks = document.getElementById('quick-links');
  private readonly newTabPage = document.getElementById('new-tab-page');
  private readonly content = document.getElementById('content');

  constructor(ipcClient?: RendererIpcClient, tabManager?: TabManager) {
    this.ipcClient = ipcClient ?? new RendererIpcClient();
    this.tabManager = tabManager ?? new TabManager();

    this.windowControls = new WindowControls(
      {
        minimizeBtn: this.minimizeBtn,
        maximizeBtn: this.maximizeBtn,
        closeBtn: this.closeBtn,
      },
      this.ipcClient,
    );

    this.runSecurityCheck();
    this.windowControls.init();
    this.initTabSubscriptions();
    this.initEventListeners();
    this.loadQuickLinks();
    this.checkAppInfo();

    // Open initial tab
    this.tabManager.createTab();
  }

  private runSecurityCheck(): void {
    const audit = auditRendererContext();
    if (!audit.passed) {
      console.warn(
        '[Security] Context isolation audit failed! Node integration detected in renderer.',
      );
    }
  }

  private async checkAppInfo(): Promise<void> {
    if (this.ipcClient.isAvailable()) {
      try {
        const [version, name, platform] = await Promise.all([
          this.ipcClient.getAppVersion(),
          this.ipcClient.getAppName(),
          this.ipcClient.getPlatform(),
        ]);
        console.log(`${name} v${version} running on ${platform}`);
      } catch (error) {
        console.error('Failed to get app telemetry via IPC:', error);
      }
    }
  }

  private initTabSubscriptions(): void {
    this.tabManager.subscribe((tab, event) => {
      switch (event) {
        case 'created':
          this.renderTabElement(tab);
          break;
        case 'switched':
          this.syncActiveTabUI(tab);
          break;
        case 'closed':
          this.removeTabElement(tab.id);
          break;
        case 'updated':
          this.updateTabElement(tab);
          break;
      }
    });
  }

  private initEventListeners(): void {
    this.newTabBtn?.addEventListener('click', () => {
      this.tabManager.createTab();
    });

    this.refreshBtn?.addEventListener('click', () => {
      this.reloadActiveTab();
    });

    this.urlBar?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const raw = this.urlBar?.textContent?.trim() || '';
        if (raw) {
          try {
            const sanitized = sanitizeNavigationUrl(raw);
            this.navigateActiveTab(sanitized);
          } catch (err) {
            console.error('Invalid URL navigation rejected:', err);
          }
        }
      } else if (e.key === 'Escape') {
        this.urlBar?.blur();
        this.updateUrlBar();
      }
    });

    this.urlBar?.addEventListener('blur', () => {
      this.updateUrlBar();
    });

    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.searchInput) {
        const query = this.searchInput.value.trim();
        if (query) {
          const searchUrl = sanitizeNavigationUrl(query);
          this.tabManager.createTab(searchUrl);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      this.handleGlobalShortcuts(e);
    });
  }

  private handleGlobalShortcuts(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === 't') {
      e.preventDefault();
      this.tabManager.createTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault();
      this.tabManager.closeActiveTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      this.reloadActiveTab();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
      e.preventDefault();
      this.focusUrlBar();
    }
  }

  private renderTabElement(tab: Tab): void {
    if (!this.tabBar || !this.newTabBtn) return;

    const tabEl = document.createElement('button');
    tabEl.className = `tab${tab.active ? ' active' : ''}`;
    tabEl.dataset.tabId = String(tab.id);

    const favicon = document.createElement('span');
    favicon.className = 'tab-favicon';
    favicon.style.background = tab.favicon || 'var(--accent-dim)';

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.title = 'Close tab';
    closeBtn.textContent = '×';

    tabEl.appendChild(favicon);
    tabEl.appendChild(title);
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('tab-close')) {
        this.tabManager.switchTab(tab.id);
      }
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.tabManager.closeTab(tab.id);
    });

    this.tabBar.insertBefore(tabEl, this.newTabBtn);
  }

  private updateTabElement(tab: Tab): void {
    const tabEl = this.tabBar?.querySelector(`[data-tab-id="${tab.id}"]`);
    const titleEl = tabEl?.querySelector('.tab-title');
    if (titleEl) {
      titleEl.textContent = tab.title || 'New Tab';
    }
    this.updateWindowTitle();
  }

  private removeTabElement(id: number): void {
    const tabEl = this.tabBar?.querySelector(`[data-tab-id="${id}"]`);
    tabEl?.remove();

    const iframe = this.iframes.get(id);
    if (iframe) {
      iframe.remove();
      this.iframes.delete(id);
    }
  }

  private syncActiveTabUI(activeTab: Tab): void {
    if (!this.tabBar) return;

    this.tabBar.querySelectorAll('.tab').forEach((el) => {
      const elTabId = Number((el as HTMLElement).dataset.tabId);
      el.classList.toggle('active', elTabId === activeTab.id);
    });

    this.iframes.forEach((iframe, id) => {
      iframe.style.display = id === activeTab.id ? 'block' : 'none';
    });

    if (activeTab.url !== 'about:blank' && !this.iframes.has(activeTab.id)) {
      this.mountTabIframe(activeTab);
    }

    const hasActiveIframe = this.iframes.has(activeTab.id);
    if (this.newTabPage) {
      this.newTabPage.style.display = hasActiveIframe ? 'none' : 'flex';
    }

    this.updateUrlBar();
    this.updateWindowTitle();
  }

  private mountTabIframe(tab: Tab): void {
    if (!this.content) return;

    const iframe = document.createElement('iframe');
    iframe.className = 'webview';
    iframe.src = tab.url;
    iframe.sandbox.add(
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-popups',
      'allow-modals',
    );
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.display = 'block';

    iframe.addEventListener('load', () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.title) {
          this.tabManager.updateTab(tab.id, { title: doc.title });
        }
      } catch {
        try {
          const parsed = new URL(tab.url);
          this.tabManager.updateTab(tab.id, { title: parsed.hostname });
        } catch {
          // ignore
        }
      }
      this.updateUrlBar();
    });

    this.content.appendChild(iframe);
    this.iframes.set(tab.id, iframe);
  }

  private navigateActiveTab(url: string): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    this.tabManager.updateTab(activeTab.id, { url, title: url });

    const existingIframe = this.iframes.get(activeTab.id);
    if (existingIframe) {
      existingIframe.src = url;
    } else {
      this.mountTabIframe(activeTab);
    }

    if (this.newTabPage) {
      this.newTabPage.style.display = 'none';
    }
    this.updateUrlBar();
  }

  private reloadActiveTab(): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const iframe = this.iframes.get(activeTab.id);
    if (iframe) {
      try {
        iframe.contentWindow?.location.reload();
      } catch {
        iframe.src = activeTab.url;
      }
    }
  }

  private updateUrlBar(): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!this.urlBar || !activeTab) return;

    if (document.activeElement !== this.urlBar) {
      this.urlBar.textContent = activeTab.url === 'about:blank' ? '' : activeTab.url;
    }
  }

  private focusUrlBar(): void {
    if (!this.urlBar) return;
    this.urlBar.focus();
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab && activeTab.url !== 'about:blank') {
      this.urlBar.textContent = activeTab.url;
    }
  }

  private updateWindowTitle(): void {
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab && activeTab.title) {
      document.title = `${activeTab.title} - Nous`;
    } else {
      document.title = 'Nous';
    }
  }

  private loadQuickLinks(): void {
    if (!this.quickLinks) return;

    const links = [
      { title: 'GitHub', url: 'https://github.com' },
      { title: 'MDN', url: 'https://developer.mozilla.org' },
      { title: 'npm', url: 'https://npmjs.com' },
      { title: 'Stack Overflow', url: 'https://stackoverflow.com' },
    ];

    links.forEach((link) => {
      const a = document.createElement('a');
      a.className = 'quick-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.title;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        this.tabManager.createTab(link.url, link.title);
      });

      this.quickLinks?.appendChild(a);
    });
  }
}
