import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import globalGoalStore from 'stores/watcher/goals';
import globalStrategyStore from 'stores/watcher/strategies';

export class Create extends ModalAction {
  static id = 'create-audit-template';

  static title = t('Create Audit Template');

  static policy = 'watcher:audit_template:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalAuditTemplateStore;
    this.goalStore = globalGoalStore;
    this.strategyStore = globalStrategyStore;
    this.goalStore.fetchList();
    this.strategyStore.fetchList();
  }

  get name() {
    return t('Create Audit Template');
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

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input',
        required: true,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      {
        name: 'goal',
        label: t('Goal'),
        type: 'select',
        options: this.goals,
        required: true,
      },
      {
        name: 'strategy',
        label: t('Strategy'),
        type: 'select',
        options: this.strategies,
        required: true,
      },
    ];
  }

  onSubmit = (values) => {
    return this.store.create(values);
  };
}

export default inject('rootStore')(observer(Create));
