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
  async start({ id }) {
    return this.submitting(
      this.client.patch(id, [
        { op: 'replace', path: '/state', value: 'TRIGGERED' },
      ])
    );
  }

  @action
  async delete({ id }) {
    return this.submitting(this.client.delete(id));
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

const globalActionPlanStore = new ActionPlanStore();
export default globalActionPlanStore;
