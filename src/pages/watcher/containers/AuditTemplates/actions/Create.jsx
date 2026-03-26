import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import globalGoalStore from 'stores/watcher/goals';
import globalStrategyStore from 'stores/watcher/strategies';

export class CreateAuditTemplate extends ModalAction {
  static id = 'create-audit-template';

  static title = t('Create Audit Template');

  static policy = 'watcher:audit_template:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalAuditTemplateStore;
    this.goalStore = globalGoalStore;
    this.strategyStore = globalStrategyStore;
    this.state = {
      goals: [],
      strategies: [],
    };
    this.fetchGoals();
    this.fetchStrategies();
  }

  async fetchGoals() {
    const goals = await this.goalStore.fetchList();
    this.setState({ goals });
  }

  async fetchStrategies() {
    const strategies = await this.strategyStore.fetchList();
    this.setState({ strategies });
  }

  get name() {
    return t('Create Audit Template');
  }

  get goalOptions() {
    return (this.state.goals || []).map((goal) => ({
      label: goal.display_name || goal.name,
      value: goal.name,
    }));
  }

  get strategyOptions() {
    return (this.state.strategies || []).map((strategy) => ({
      label: strategy.display_name || strategy.name,
      value: strategy.name,
    }));
  }

  get defaultValue() {
    return {
      name: '',
      description: '',
    };
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input-name',
        required: true,
        withoutChinese: true,
      },
      {
        name: 'goal',
        label: t('Goal'),
        type: 'select',
        options: this.goalOptions,
        required: true,
      },
      {
        name: 'strategy',
        label: t('Strategy'),
        type: 'select',
        options: this.strategyOptions,
        required: false,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        required: false,
      },
      {
        name: 'scope',
        label: t('Scope'),
        type: 'textarea',
        required: false,
        placeholder: t('JSON format scope, e.g. []'),
      },
    ];
  }

  onSubmit = (values) => {
    const { scope, ...rest } = values;
    const body = { ...rest };
    if (scope) {
      try {
        body.scope = JSON.parse(scope);
      } catch (e) {
        body.scope = scope;
      }
    }
    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(CreateAuditTemplate));
