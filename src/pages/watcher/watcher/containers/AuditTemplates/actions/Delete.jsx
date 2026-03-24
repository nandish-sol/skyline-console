import { ConfirmAction } from 'containers/Action';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';

export default class DeleteAction extends ConfirmAction {
  static policy = 'watcher:audit_template:delete';

  static allowed = () => Promise.resolve(true);

  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Audit Template');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete');
  }

  get actionName() {
    return t('delete audit template');
  }

  onSubmit = (data) => {
    const { uuid } = data;
    return globalAuditTemplateStore.delete({ id: uuid });
  };
}
