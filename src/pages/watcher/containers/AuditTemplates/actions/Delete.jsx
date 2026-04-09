import { ConfirmAction } from 'containers/Action';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';

export default class Delete extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete Audit Template');
  }

  get actionName() {
    return t('Delete Audit Template');
  }

  get buttonText() {
    return t('Delete');
  }

  get isDanger() {
    return true;
  }

  policy = 'watcher:audit_template:delete';

  getItemName = (data) => data.name || data.uuid || data.id || '-';

  allowedCheckFunc = () => true;

  onSubmit = (item) => {
    const { uuid } = item;
    return globalAuditTemplateStore.delete({ id: uuid });
  };
}
