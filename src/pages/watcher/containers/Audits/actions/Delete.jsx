import { ConfirmAction } from 'containers/Action';
import globalAuditStore from 'stores/watcher/audits';

export default class DeleteAction extends ConfirmAction {
  static policy = 'watcher:audit:delete';

  static allowed = () => Promise.resolve(true);

  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Audit');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete audit');
  }

  onSubmit = (data) => {
    const { uuid } = data;
    return globalAuditStore.delete({ id: uuid });
  };
}
