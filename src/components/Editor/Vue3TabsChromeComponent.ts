import { Tab } from 'vue3-tabs-chrome';

export interface Vue3TabsChromeComponent {
  addTab: (...newTabs: Array<Tab>) => void;
  removeTab: (tabKey: string | number) => void;
}
