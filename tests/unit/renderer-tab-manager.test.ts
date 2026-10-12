import { describe, expect, it } from 'vitest';
import { TabManager } from '../../src/renderer/tabs/tab-manager.js';

describe('TabManager', () => {
  it('creates and activates a default blank tab upon instantiation', () => {
    const manager = new TabManager();
    const tab = manager.createTab();

    expect(tab.id).toBe(1);
    expect(tab.url).toBe('about:blank');
    expect(tab.active).toBe(true);
    expect(manager.getActiveTabId()).toBe(1);
    expect(manager.getAllTabs()).toHaveLength(1);
  });

  it('switches between multiple tabs and maintains active flags', () => {
    const manager = new TabManager();
    const tab1 = manager.createTab('https://a.com', 'Site A');
    const tab2 = manager.createTab('https://b.com', 'Site B');

    expect(manager.getActiveTabId()).toBe(tab2.id);
    expect(manager.getTab(tab1.id)?.active).toBe(false);
    expect(manager.getTab(tab2.id)?.active).toBe(true);

    manager.switchTab(tab1.id);
    expect(manager.getActiveTabId()).toBe(tab1.id);
    expect(manager.getTab(tab1.id)?.active).toBe(true);
    expect(manager.getTab(tab2.id)?.active).toBe(false);
  });

  it('closes tabs and switches to previous tab', () => {
    const manager = new TabManager();
    const tab1 = manager.createTab('https://a.com');
    const tab2 = manager.createTab('https://b.com');

    manager.closeTab(tab2.id);
    expect(manager.getAllTabs()).toHaveLength(1);
    expect(manager.getActiveTabId()).toBe(tab1.id);

    // Closing last tab recreates a new default tab
    manager.closeTab(tab1.id);
    expect(manager.getAllTabs()).toHaveLength(1);
    expect(manager.getActiveTab()?.url).toBe('about:blank');
  });

  it('updates tab metadata dynamically', () => {
    const manager = new TabManager();
    const tab = manager.createTab();

    manager.updateTab(tab.id, { title: 'Updated Title', url: 'https://nous.browser' });
    const updated = manager.getTab(tab.id);

    expect(updated?.title).toBe('Updated Title');
    expect(updated?.url).toBe('https://nous.browser');
  });
});
