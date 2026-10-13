import { AddressBar } from './address-bar/index.js';
import { RendererIpcClient } from './ipc/index.js';
import { HistoryController } from './navigation/index.js';
import { auditRendererContext, sanitizeNavigationUrl } from './security/index.js';
import { TabManager } from './tabs/index.js';
import type { Tab } from './tabs/types.js';
import { WindowControls } from './window/index.js';

export class BrowserApp {
  public readonly ipcClient: RendererIpcClient;
  public readonly tabManager: TabManager;
  public readonly windowControls: WindowControls;
  public readonly addressBar: AddressBar;
  public readonly historyController: HistoryController;

  private readonly iframes: Map<number, HTMLIFrameElement> = new Map();

  private readonly tabBar = document.getElementById('tab-bar');
  private readonly newTabBtn = document.getElementById('new-tab-btn');
  private readonly backBtn = document.getElementById('back-btn');
  private readonly urlBar = document.getElementById('url-bar') as HTMLElement | null;
  private readonly refreshBtn = document.getElementById('refresh-btn');
  private readonly closeBtn = document.getElementById('close-btn');
  private readonly minimizeBtn = document.getElementById('minimize-btn');
  private readonly maximizeBtn = document.getElementById('maximize-btn');
  private readonly searchInput = document.getElementById('search-input') as HTMLInputElement | null;
  private readonly quickLinks = document.getElementById('quick-links');
  private readonly newTabPage = document.getElementById('new-tab-page');
  private readonly content = document.getElementById('content');

  constructor(ipcClient?: RendererIpcClient, tabManager?: TabManager, addressBar?: AddressBar) {
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

    const urlBarContainer = document.getElementById('url-bar-container');
    const securityBadge = document.getElementById('security-badge');

    this.addressBar =
      addressBar ??
      new AddressBar({
        elements: {
          container: urlBarContainer,
          input: this.urlBar,
          refreshBtn: this.refreshBtn,
          securityBadge,
        },
      });

    this.historyController = new HistoryController({
      backBtn: this.backBtn,
      ipcClient: this.ipcClient,
      getTabId: () => {
        const activeTab = this.tabManager.getActiveTab();
        return activeTab ? String(activeTab.id) : undefined;
      },
      onGoBack: () => {
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
          const iframe = this.iframes.get(activeTab.id);
          if (iframe) {
            try {
              iframe.contentWindow?.history.back();
            } catch {
              // ignore cross-origin fallback errors
            }
          }
        }
      },
    });

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
    if (this.ipcClient.isAvailable()) {
      this.ipcClient.onNavigationStateChange((state) => {
        const tabIdNum = Number(state.tabId);
        const tab = this.tabManager.getTab(tabIdNum) || this.tabManager.getActiveTab();
        if (tab) {
          this.tabManager.updateTab(tab.id, {
            url: state.url,
            title: state.title,
          });
        }
        this.addressBar.setUrl(state.url);
        if (state.title) {
          document.title = `${state.title} - Nous`;
        }
        if (this.refreshBtn) {
          this.refreshBtn.classList.toggle('loading', state.isLoading);
        }
      });
    }

    this.newTabBtn?.addEventListener('click', () => {
      this.tabManager.createTab();
    });

    this.addressBar.onNavigate((navEvent) => {
      this.navigateActiveTab(navEvent.url);
    });

    this.addressBar.onRefresh(() => {
      this.reloadActiveTab();
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
      this.addressBar.focus();
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

    this.addressBar.setUrl(activeTab.url);
    this.updateWindowTitle();

    if (this.ipcClient.isAvailable()) {
      this.ipcClient
        .getNavigationCapabilities(String(activeTab.id))
        .then((caps) => {
          this.historyController.setCapabilities(caps);
        })
        .catch(() => {
          // ignore capability fetch error during tab synchronization
        });
    }
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
      this.addressBar.setUrl(tab.url);
    });

    this.content.appendChild(iframe);
    this.iframes.set(tab.id, iframe);
  }

  private navigateActiveTab(url: string): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    this.tabManager.updateTab(activeTab.id, { url, title: url });

    if (this.ipcClient.isAvailable()) {
      this.ipcClient.loadUrl({ tabId: String(activeTab.id), url }).catch((err) => {
        console.error('[Navigation] Failed to load URL via IPC:', err);
      });
    }

    const existingIframe = this.iframes.get(activeTab.id);
    if (existingIframe) {
      existingIframe.src = url;
    } else {
      this.mountTabIframe(activeTab);
    }

    if (this.newTabPage) {
      this.newTabPage.style.display = 'none';
    }
    this.addressBar.setUrl(url);
  }

  private reloadActiveTab(): void {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    if (this.ipcClient.isAvailable() && activeTab.url) {
      this.ipcClient.loadUrl({ tabId: String(activeTab.id), url: activeTab.url }).catch((err) => {
        console.error('[Navigation] Failed to reload URL via IPC:', err);
      });
    }

    const iframe = this.iframes.get(activeTab.id);
    if (iframe) {
      try {
        iframe.contentWindow?.location.reload();
      } catch {
        iframe.src = activeTab.url;
      }
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
