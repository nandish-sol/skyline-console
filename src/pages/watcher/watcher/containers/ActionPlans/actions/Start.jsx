import { ConfirmAction } from 'containers/Action';
import globalActionPlanStore from 'stores/watcher/actionPlans';

export default class StartAction extends ConfirmAction {
  static policy = 'watcher:action_plan:update';

  static allowed = (item) => {
    return Promise.resolve(
      item.state === 'RECOMMENDED' || item.state === 'PENDING'
    );
  };

  get id() {
    return 'start';
  }

  get title() {
    return t('Start Action Plan');
  }

  get actionName() {
    return t('start action plan');
  }

  confirmContext = (data) => {
    const name = this.getName(data);
    return t('Are you sure to {action} (Action Plan: {name})?', {
      action: this.actionNameDisplay || this.title,
      name,
    });
  };

  onSubmit = (data) => {
    const { uuid } = data;
    return globalActionPlanStore.start(uuid);
  };
}
