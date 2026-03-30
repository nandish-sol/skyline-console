import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditStore from 'stores/watcher/audits';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import globalGoalStore from 'stores/watcher/goals';
import globalStrategyStore from 'stores/watcher/strategies';

export class CreateAudit extends ModalAction {
  static id = 'create-audit';

  static title = t('Create Audit');

  static policy = 'watcher:audit:create';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalAuditStore;
    this.auditTemplateStore = globalAuditTemplateStore;
    this.goalStore = globalGoalStore;
    this.strategyStore = globalStrategyStore;
    this.state = {
      auditTemplates: [],
      goals: [],
      strategies: [],
      allStrategies: [],
      selectedStrategy: null,
      parametersSpec: null,
    };
    this.fetchAuditTemplates();
    this.fetchGoals();
    this.fetchStrategies();
  }

  async fetchAuditTemplates() {
    const auditTemplates = await this.auditTemplateStore.fetchList();
    this.setState({ auditTemplates });
  }

  async fetchGoals() {
    const goals = await this.goalStore.fetchList();
    this.setState({ goals });
  }

  async fetchStrategies() {
    const strategies = await this.strategyStore.fetchList();
    this.setState({ strategies, allStrategies: strategies });
  }

  onGoalChange = (value) => {
    const { allStrategies } = this.state;
    const filtered = value
      ? allStrategies.filter((s) => s.goal_name === value)
      : allStrategies;
    this.setState({
      strategies: filtered,
      selectedStrategy: null,
      parametersSpec: null,
    });
    this.formRef.current.setFieldsValue({ strategy: undefined });
  };

  get name() {
    return t('Create Audit');
  }

  get isTemplate() {
    const { use_template } = this.state;
    return use_template !== 'direct';
  }

  get auditTemplateOptions() {
    return (this.state.auditTemplates || []).map((template) => ({
      label: template.name,
      value: template.uuid,
    }));
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
      audit_type: 'ONESHOT',
      use_template: 'template',
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
    const { properties } = parametersSpec;
    const required = parametersSpec.required || [];
    return Object.keys(properties).map((key) => {
      const prop = properties[key];
      const item = {
        name: `param_${key}`,
        label: key,
        required: required.includes(key),
        extra: prop.description || '',
        hidden: this.isTemplate,
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
    const paramItems = this.getParameterFormItems();
    const items = [
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
        name: 'use_template',
        label: t('Creation Mode'),
        type: 'radio',
        options: [
          { label: t('Use Template'), value: 'template' },
          { label: t('Direct (Goal + Strategy)'), value: 'direct' },
        ],
        required: true,
      },
      {
        name: 'audit_template_uuid',
        label: t('Audit Template'),
        type: 'select',
        options: this.auditTemplateOptions,
        required: this.isTemplate,
        hidden: !this.isTemplate,
      },
      {
        name: 'goal',
        label: t('Goal'),
        type: 'select',
        options: this.goalOptions,
        required: !this.isTemplate,
        hidden: this.isTemplate,
        onChange: (value) => this.onGoalChange(value),
      },
      {
        name: 'strategy',
        label: t('Strategy'),
        type: 'select',
        options: this.strategyOptions,
        required: false,
        hidden: this.isTemplate,
        onChange: (value) => this.onStrategyChange(value),
      },
      ...paramItems,
    ];

    return items;
  }

  onSubmit = (values) => {
    const { use_template, goal, strategy, ...rest } = values;
    const body = {
      name: rest.name,
      audit_type: rest.audit_type,
    };

    if (!rest.name) {
      delete body.name;
    }

    if (use_template === 'template') {
      body.audit_template_uuid = rest.audit_template_uuid;
    } else {
      body.goal = goal;
      if (strategy) {
        body.strategy = strategy;
      }
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
    }

    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(CreateAudit));
