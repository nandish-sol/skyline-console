import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class StrategyStore extends Base {
  get client() {
    return client.watcher.strategies;
  }

  get listResponseKey() {
    return 'strategies';
  }

  get paramsFunc() {
    return (params) => {
      const { all_projects, ...rest } = params;
      return rest;
    };
  }

  get paramsFuncPage() {
    return (params) => {
      const { current, all_projects, ...rest } = params;
      return rest;
    };
  }

  get rowKey() {
    return 'uuid';
  }

  @action
  async fetchDetail({ id, silent }) {
    if (!silent) {
      this.isLoading = true;
    }
    const result = await this.client.show(id);
    this.detail = result;
    this.isLoading = false;
    return result;
  }
}

const globalStrategyStore = new StrategyStore();
export default globalStrategyStore;
