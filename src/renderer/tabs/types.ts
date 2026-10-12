export interface Tab {
  id: number;
  title: string;
  url: string;
  favicon: string;
  active: boolean;
}

export type TabChangeListener = (
  tab: Tab,
  event: 'created' | 'closed' | 'switched' | 'updated',
) => void;
