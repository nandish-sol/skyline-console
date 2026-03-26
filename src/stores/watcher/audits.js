import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class AuditStore extends Base {
  get client() {
    return client.watcher.audits;
  }

  get rowKey() {
    return 'uuid';
  }

  @action
  async create(data) {
    return this.submitting(this.client.create(data));
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

const globalAuditStore = new AuditStore();
export default globalAuditStore;
