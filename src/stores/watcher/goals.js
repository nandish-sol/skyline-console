import Base from 'stores/base';
import client from 'client';

export class GoalStore extends Base {
  get client() {
    return client.watcher.goals;
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
}

const globalGoalStore = new GoalStore();
export default globalGoalStore;
