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

const globalGoalStore = new GoalStore();
export default globalGoalStore;
