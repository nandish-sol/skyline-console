import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class ActionPlanStore extends Base {
  get client() {
    return client.watcher.actionPlans;
  }

  get rowKey() {
    return 'uuid';
  }

  @action
  async start(id) {
    return this.client.update(id, { state: 'TRIGGERED' });
  }

  @action
  async delete({ id }) {
    return this.client.delete(id);
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

const globalActionPlanStore = new ActionPlanStore();
export default globalActionPlanStore;
