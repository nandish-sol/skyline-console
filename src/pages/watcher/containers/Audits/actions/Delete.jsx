import { ConfirmAction } from 'containers/Action';
import globalAuditStore from 'stores/watcher/audits';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Audit');
  }

  get actionName() {
    return t('Delete Audit');
  }

  get buttonText() {
    return t('Delete');
  }

  get isDanger() {
    return true;
  }

  policy = 'watcher:audit:delete';

  allowedCheckFunc = () => true;

  onSubmit = (item) => {
    const { uuid } = item;
    return globalAuditStore.delete({ id: uuid });
  };
}
