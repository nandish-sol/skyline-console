import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditStore from 'stores/watcher/audits';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';

export class CreateAudit extends ModalAction {
  static id = 'create-audit';

  static title = t('Create Audit');

  static policy = 'watcher:audit:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalAuditStore;
    this.auditTemplateStore = globalAuditTemplateStore;
    this.state = {
      auditTemplates: [],
    };
    this.fetchAuditTemplates();
  }

  async fetchAuditTemplates() {
    const auditTemplates = await this.auditTemplateStore.fetchList();
    this.setState({ auditTemplates });
  }

  get name() {
    return t('Create Audit');
  }

  get auditTemplateOptions() {
    return (this.state.auditTemplates || []).map((template) => ({
      label: template.name,
      value: template.uuid,
    }));
  }

  get defaultValue() {
    return {
      name: '',
      audit_type: 'ONESHOT',
    };
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: false,
        withoutChinese: true,
      },
      {
        name: 'audit_type',
        label: t('Audit Type'),
        type: 'select',
        options: [
          { label: t('One Shot'), value: 'ONESHOT' },
          { label: t('Continuous'), value: 'CONTINUOUS' },
        ],
        required: true,
      },
      {
        name: 'audit_template_uuid',
        label: t('Audit Template'),
        type: 'select',
        options: this.auditTemplateOptions,
        required: true,
      },
    ];
  }

  onSubmit = (values) => {
    return this.store.create(values);
  };
}

export default inject('rootStore')(observer(CreateAudit));
