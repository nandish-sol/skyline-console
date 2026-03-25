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
      selectedStrategy: null,
      parametersSpec: null,
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

  onStrategyChange = async (value) => {
    if (!value) {
      this.setState({ selectedStrategy: null, parametersSpec: null });
      return;
    }
    const strategy = (this.state.strategies || []).find(
      (s) => s.name === value
    );
    if (strategy) {
      const detail = await this.strategyStore.fetchDetail({
        id: strategy.uuid,
      });
      const spec = detail.parameters_spec;
      this.setState({
        selectedStrategy: value,
        parametersSpec: spec,
      });
    }
  };

  getParameterFormItems() {
    const { parametersSpec } = this.state;
    if (!parametersSpec || !parametersSpec.properties) {
      return [];
    }
    const properties = parametersSpec.properties;
    const required = parametersSpec.required || [];
    return Object.keys(properties).map((key) => {
      const prop = properties[key];
      const item = {
        name: `param_${key}`,
        label: key,
        required: required.includes(key),
        extra: prop.description || '',
      };
      if (prop.type === 'number' || prop.type === 'integer') {
        item.type = 'input-number';
        if (prop.default !== undefined) {
          item.placeholder = `${t('Default')}: ${prop.default}`;
        }
        if (prop.minimum !== undefined) {
          item.min = prop.minimum;
        }
        if (prop.maximum !== undefined) {
          item.max = prop.maximum;
        }
      } else if (prop.type === 'boolean') {
        item.type = 'radio';
        item.options = [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ];
      } else if (prop.type === 'string' && prop.choice) {
        item.type = 'select';
        item.options = prop.choice.map((c) => ({ label: c, value: c }));
      } else if (prop.type === 'array') {
        item.type = 'textarea';
        item.placeholder = t('JSON array format, e.g. []');
      } else if (prop.type === 'object') {
        item.type = 'textarea';
        item.placeholder = t('JSON object format, e.g. {}');
      } else {
        item.type = 'input';
        if (prop.default !== undefined) {
          item.placeholder = `${t('Default')}: ${prop.default}`;
        }
      }
      return item;
    });
  }

  get formItems() {
    const items = [
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
        onChange: (value) => this.onStrategyChange(value),
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

    const paramItems = this.getParameterFormItems();
    if (paramItems.length > 0) {
      items.push({
        name: 'params_divider',
        label: t('Strategy Parameters'),
        type: 'divider',
      });
      items.push(...paramItems);
    }

    return items;
  }

  onSubmit = (values) => {
    const { scope, ...rest } = values;
    const body = {
      name: rest.name,
      goal: rest.goal,
      description: rest.description,
    };

    if (rest.strategy) {
      body.strategy = rest.strategy;
    }

    if (scope) {
      try {
        body.scope = JSON.parse(scope);
      } catch (e) {
        body.scope = scope;
      }
    }

    // Collect parameters
    const parameters = {};
    const { parametersSpec } = this.state;
    if (parametersSpec && parametersSpec.properties) {
      Object.keys(parametersSpec.properties).forEach((key) => {
        const val = values[`param_${key}`];
        if (val !== undefined && val !== null && val !== '') {
          const prop = parametersSpec.properties[key];
          if (prop.type === 'number' || prop.type === 'integer') {
            parameters[key] = Number(val);
          } else if (prop.type === 'boolean') {
            parameters[key] = val === 'true' || val === true;
          } else if (prop.type === 'array' || prop.type === 'object') {
            try {
              parameters[key] = JSON.parse(val);
            } catch (e) {
              parameters[key] = val;
            }
          } else {
            parameters[key] = val;
          }
        }
      });
    }
    if (Object.keys(parameters).length > 0) {
      body.parameters = parameters;
    }

    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(CreateAuditTemplate));
