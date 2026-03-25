import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class GoalStore extends Base {
  get client() {
    return client.watcher.goals;
  }

  get rowKey() {
    return 'uuid';
  }

  async getCountForPage(newParams, newData, all_projects, result) {
    const items = result.goals || [];
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

const globalGoalStore = new GoalStore();
export default globalGoalStore;
