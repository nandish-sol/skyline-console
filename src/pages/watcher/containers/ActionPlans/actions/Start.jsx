import { ConfirmAction } from 'containers/Action';
import globalActionPlanStore from 'stores/watcher/actionPlans';

export default class Start extends ConfirmAction {
  get id() {
    return 'start';
  }

  get title() {
    return t('Start');
  }

  get actionName() {
    return t('start action plan');
  }

  policy = 'watcher:action_plan:update';

  getItemName = (data) => data.uuid || data.id || '-';

  allowedCheckFunc = (item) => item.state === 'RECOMMENDED';

  onSubmit = (item) => {
    const { uuid } = item;
    return globalActionPlanStore.start({ id: uuid });
  };
}
