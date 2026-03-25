import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class StrategyStore extends Base {
  get client() {
    return client.watcher.strategies;
  }

  get rowKey() {
    return 'uuid';
  }

  async getCountForPage(newParams, newData, all_projects, result) {
    const items = result.strategies || [];
    return { count: items.length, total: items.length };
  }

  @action
  async fetchDetail({ id, silent }) {
    if (!silent) {
      this.isLoading = true;
    }
    const result = await this.client.show(id);
    const detail = result;
    this.detail = detail;
    this.isLoading = false;
    return detail;
  }
}

const globalStrategyStore = new StrategyStore();
export default globalStrategyStore;
