import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class ActionStore extends Base {
  get client() {
    return client.watcher.actions;
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
    const detail = result;
    this.detail = detail;
    this.isLoading = false;
    return detail;
  }
}

const globalActionStore = new ActionStore();
export default globalActionStore;
