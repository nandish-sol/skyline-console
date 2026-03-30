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

  get needGetProject() {
    return false;
  }

  get paramsFunc() {
    return (params) => {
      const { all_projects, current, ...rest } = params;
      return rest;
    };
  }

  get paramsFuncPage() {
    return (params) => {
      const { all_projects, current, ...rest } = params;
      return rest;
    };
  }

  @action
  async create(newbody) {
    return this.client.create(newbody);
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

const globalAuditStore = new AuditStore();
export default globalAuditStore;
