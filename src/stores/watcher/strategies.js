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

  get listResponseKey() {
    return 'strategies';
  }

  get paramsFunc() {
    return (params) => {
      const { all_projects, current, limit, ...rest } = params;
      return rest;
    };
  }

  get paramsFuncPage() {
    return (params) => {
      const { all_projects, current, limit, ...rest } = params;
      return rest;
    };
  }

  async getCountForPage(newParams, newData) {
    return { count: newData.length };
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
