import { ConfirmAction } from 'containers/Action';
import globalActionPlanStore from 'stores/watcher/actionPlans';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Action Plan');
  }

  get actionName() {
    return t('Delete Action Plan');
  }

  get buttonText() {
    return t('Delete');
  }

  get isDanger() {
    return true;
  }

  policy = 'watcher:action_plan:delete';

  getItemName = (data) => data.uuid || data.id || '-';

  allowedCheckFunc = () => true;

  onSubmit = (item) => {
    const { uuid } = item;
    return globalActionPlanStore.delete({ id: uuid });
  };
}
