import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class ActionPlanStore extends Base {
  get client() {
    return client.watcher.actionPlans;
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

  async getCountForPage(newParams, newData, all_projects, result) {
    const items = result.action_plans || [];
    return { count: items.length, total: items.length };
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
    // Fetch related actions for this action plan
    try {
      const actionsResult = await client.watcher.actions.list({
        action_plan_uuid: id,
      });
      result.actions = actionsResult.actions || [];
    } catch (e) {
      result.actions = [];
    }
    this.detail = result;
    this.isLoading = false;
    return result;
  }
}

const globalActionPlanStore = new ActionPlanStore();
export default globalActionPlanStore;
