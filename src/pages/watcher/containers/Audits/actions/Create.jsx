import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditStore from 'stores/watcher/audits';
import globalGoalStore from 'stores/watcher/goals';
import globalStrategyStore from 'stores/watcher/strategies';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';

export class Create extends ModalAction {
  static id = 'create-audit';

  static title = t('Create Audit');

  static policy = 'watcher:audit:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalAuditStore;
    this.goalStore = globalGoalStore;
    this.strategyStore = globalStrategyStore;
    this.auditTemplateStore = globalAuditTemplateStore;
    this.goalStore.fetchList();
    this.strategyStore.fetchList();
    this.auditTemplateStore.fetchList();
  }

  get name() {
    return t('Create Audit');
  }

  get goals() {
    return (this.goalStore.list.data || []).map((item) => ({
      label: item.display_name || item.name,
      value: item.name,
    }));
  }

  get strategies() {
    return (this.strategyStore.list.data || []).map((item) => ({
      label: item.display_name || item.name,
      value: item.name,
    }));
  }

  get auditTemplates() {
    return (this.auditTemplateStore.list.data || []).map((item) => ({
      label: item.name,
      value: item.uuid,
    }));
  }

  get formItems() {
    return [
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
        options: this.auditTemplates,
        tip: t(
          'Select an existing audit template or configure goal/strategy below'
        ),
      },
      {
        name: 'goal',
        label: t('Goal'),
        type: 'select',
        options: this.goals,
      },
      {
        name: 'strategy',
        label: t('Strategy'),
        type: 'select',
        options: this.strategies,
      },
    ];
  }

  onSubmit = (values) => {
    return this.store.create(values);
  };
}

export default inject('rootStore')(observer(Create));
