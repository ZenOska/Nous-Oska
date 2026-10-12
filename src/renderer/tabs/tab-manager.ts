import type { Tab, TabChangeListener } from './types.js';

export class TabManager {
  private tabs: Map<number, Tab> = new Map();
  private activeTabId: number | null = null;
  private nextTabId = 1;
  private listeners: Set<TabChangeListener> = new Set();

  public subscribe(listener: TabChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(tab: Tab, event: 'created' | 'closed' | 'switched' | 'updated'): void {
    for (const listener of this.listeners) {
      listener(tab, event);
    }
  }

  public createTab(url = 'about:blank', title = 'New Tab'): Tab {
    const id = this.nextTabId++;
    const tab: Tab = {
      id,
      title,
      url,
      favicon: '',
      active: false,
    };

    this.tabs.set(id, tab);
    this.notify(tab, 'created');
    this.switchTab(id);
    return tab;
  }

  public switchTab(id: number): Tab | null {
    const targetTab = this.tabs.get(id);
    if (!targetTab) {
      return null;
    }

    for (const tab of this.tabs.values()) {
      tab.active = tab.id === id;
    }

    this.activeTabId = id;
    this.notify(targetTab, 'switched');
    return targetTab;
  }

  public closeTab(id: number): Tab | null {
    const tabToClose = this.tabs.get(id);
    if (!tabToClose) {
      return null;
    }

    const wasActive = tabToClose.active;
    this.tabs.delete(id);
    this.notify(tabToClose, 'closed');

    if (wasActive) {
      const remainingTabs = this.getAllTabs();
      if (remainingTabs.length > 0) {
        const nextActive = remainingTabs[remainingTabs.length - 1];
        this.switchTab(nextActive.id);
      } else {
        this.activeTabId = null;
        this.createTab();
      }
    }

    return tabToClose;
  }

  public closeActiveTab(): Tab | null {
    if (this.activeTabId === null) {
      return null;
    }
    return this.closeTab(this.activeTabId);
  }

  public getTab(id: number): Tab | undefined {
    return this.tabs.get(id);
  }

  public getAllTabs(): Tab[] {
    return Array.from(this.tabs.values());
  }

  public getActiveTab(): Tab | undefined {
    return this.activeTabId !== null ? this.tabs.get(this.activeTabId) : undefined;
  }

  public getActiveTabId(): number | null {
    return this.activeTabId;
  }

  public updateTab(
    id: number,
    updates: Partial<Pick<Tab, 'title' | 'url' | 'favicon'>>,
  ): Tab | undefined {
    const tab = this.tabs.get(id);
    if (!tab) {
      return undefined;
    }

    if (typeof updates.title === 'string') tab.title = updates.title;
    if (typeof updates.url === 'string') tab.url = updates.url;
    if (typeof updates.favicon === 'string') tab.favicon = updates.favicon;

    this.notify(tab, 'updated');
    return tab;
  }
}
