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
  // eslint-disable-next-line no-unused-vars
  async fetchList(params) {
    this.list.isLoading = true;
    try {
      const result = await this.client.list();
      // eslint-disable-next-line no-console
      console.log(
        'WATCHER_GOALS_RESULT:',
        JSON.stringify(result).substring(0, 200)
      );
      const data = this.getListDataFromResult(result);
      // eslint-disable-next-line no-console
      console.log('WATCHER_GOALS_DATA:', data.length, 'items');
      this.list.update({
        data,
        total: data.length,
        limit: data.length,
        page: 1,
        isLoading: false,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('WATCHER_GOALS_ERROR:', e.message || e);
      this.list.isLoading = false;
    }
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
