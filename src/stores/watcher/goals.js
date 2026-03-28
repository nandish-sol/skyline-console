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

  get listResponseKey() {
    return 'goals';
  }

  get needGetProject() {
    return false;
  }

  get filterByApi() {
    return true;
  }

  updateParamsSortPage = (params) => params;

  paramsFuncPage = (params) => {
    // eslint-disable-next-line no-unused-vars
    const { all_projects, current, ...rest } = params;
    return rest;
  };

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

const globalGoalStore = new GoalStore();
export default globalGoalStore;
