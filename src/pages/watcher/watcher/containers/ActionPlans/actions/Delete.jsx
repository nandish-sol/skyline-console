import { ConfirmAction } from 'containers/Action';
import globalActionPlanStore from 'stores/watcher/actionPlans';

export default class DeleteAction extends ConfirmAction {
  static policy = 'watcher:action_plan:delete';

  static allowed = () => Promise.resolve(true);

  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Action Plan');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete action plan');
  }

  onSubmit = (data) => {
    const { uuid } = data;
    return globalActionPlanStore.delete({ id: uuid });
  };
}
