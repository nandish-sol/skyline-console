import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import globalStrategyStore from 'stores/watcher/strategies';
import client from 'client';

export class Create extends ModalAction {
  static id = 'create-audit-template';

  static title = t('Create Audit Template');

  static policy = '';

  static allowed = () => Promise.resolve(true);

  static get modalSize() {
    return 'large';
  }

  getModalSize() {
    return 'large';
  }

  init() {
    this.store = globalAuditTemplateStore;
    this.strategyStore = globalStrategyStore;
    this.state = {
      ...this.state,
      goals: [],
      strategies: [],
      allStrategies: [],
      parametersSpec: null,
      selectedScopes: [],
      availabilityZones: [],
      hostAggregates: [],
      computeNodes: [],
      instances: [],
    };
    this.fetchGoals();
    this.fetchStrategies();
  }

  async fetchGoals() {
    try {
      const result = await client.watcher.goals.list();
      this.setState({ goals: result.goals || [] });
    } catch (e) {
      console.error('Failed to fetch goals', e);
    }
  }

  async fetchStrategies() {
    try {
      const result = await client.watcher.strategies.list();
      this.setState({
        allStrategies: result.strategies || [],
        strategies: result.strategies || [],
      });
    } catch (e) {
      console.error('Failed to fetch strategies', e);
    }
  }

  async fetchNovaData() {
    try {
      const [azResult, aggResult, hyperResult, serverResult] =
        await Promise.all([
          client.nova.zone.list(),
          client.nova.aggregates.list(),
          client.nova.hypervisors.list(),
          client.nova.servers.list({ all_tenants: true }),
        ]);
      const azList = Array.isArray(azResult.availabilityZoneInfo)
        ? azResult.availabilityZoneInfo
        : Array.isArray(azResult)
        ? azResult
        : [];
      const aggList = Array.isArray(aggResult.aggregates)
        ? aggResult.aggregates
        : Array.isArray(aggResult)
        ? aggResult
        : [];
      const hyperList = Array.isArray(hyperResult.hypervisors)
        ? hyperResult.hypervisors
        : Array.isArray(hyperResult)
        ? hyperResult
        : [];
      const serverList = Array.isArray(serverResult.servers)
        ? serverResult.servers
        : Array.isArray(serverResult)
        ? serverResult
        : [];
      this.setState({
        availabilityZones: azList.map((az) => ({
          label: az.zoneName || az.name,
          value: az.zoneName || az.name,
        })),
        hostAggregates: aggList.map((agg) => ({
          label: agg.name,
          value: agg.id,
        })),
        computeNodes: hyperList.map((h) => ({
          label: h.hypervisor_hostname || h.host || h.id,
          value: h.hypervisor_hostname || h.host || String(h.id),
        })),
        instances: serverList.map((s) => ({
          label: `${s.name} (${s.id})`,
          value: s.id,
        })),
      });
    } catch (e) {
      console.error('Failed to fetch Nova data', e);
    }
  }

  get name() {
    return t('Create Audit Template');
  }

  get nameForStateUpdate() {
    return ['selectedScopes'];
  }

  onGoalChange = (value) => {
    const { allStrategies } = this.state;
    const filtered = value
      ? allStrategies.filter((s) => s.goal_name === value)
      : allStrategies;
    this.setState({ strategies: filtered, parametersSpec: null });
    this.formRef.current.setFieldsValue({ strategy: undefined });
  };

  onStrategyChange = async (value) => {
    if (!value) {
      this.setState({ parametersSpec: null });
      return;
    }
    const { allStrategies } = this.state;
    const strategy = allStrategies.find((s) => s.name === value);
    if (strategy) {
      try {
        const detail = await this.strategyStore.fetchDetail({
          id: strategy.uuid,
        });
        this.setState({ parametersSpec: detail.parameters_spec });
      } catch (e) {
        this.setState({ parametersSpec: null });
      }
    }
  };

  onScopeChange = (value) => {
    this.setState({ selectedScopes: value || [] });
    if (
      value &&
      value.length > 0 &&
      this.state.availabilityZones.length === 0
    ) {
      this.fetchNovaData();
    }
  };

  getParameterFormItems() {
    const { parametersSpec } = this.state;
    if (!parametersSpec || !parametersSpec.properties) return [];
    return Object.keys(parametersSpec.properties).map((key) => {
      const prop = parametersSpec.properties[key];
      const item = {
        name: `param_${key}`,
        label: key,
        extra: prop.description || '',
      };
      if (prop.type === 'number' || prop.type === 'integer') {
        item.type = 'input-number';
        if (prop.default !== undefined)
          item.placeholder = `${t('Default')}: ${prop.default}`;
      } else if (prop.type === 'string' && prop.choice) {
        item.type = 'select';
        item.options = prop.choice.map((c) => ({ label: c, value: c }));
      } else {
        item.type = 'input';
        if (prop.default !== undefined)
          item.placeholder = `${t('Default')}: ${prop.default}`;
      }
      return item;
    });
  }

  get formItems() {
    const { goals, strategies, selectedScopes } = this.state;
    const goalOptions = goals.map((g) => ({
      label: g.display_name || g.name,
      value: g.name,
    }));
    const strategyOptions = strategies.map((s) => ({
      label: s.display_name || s.name,
      value: s.name,
    }));
    const paramItems = this.getParameterFormItems();
    const hasScope = (key) => (selectedScopes || []).includes(key);

    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input',
        required: true,
      },
      {
        name: 'goal',
        label: t('Goal'),
        type: 'select',
        options: goalOptions,
        required: true,
        onChange: (value) => this.onGoalChange(value),
      },
      {
        name: 'strategy',
        label: t('Strategy'),
        type: 'select',
        options: strategyOptions,
        onChange: (value) => this.onStrategyChange(value),
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      ...paramItems,
      {
        name: 'selectedScopes',
        label: t('Scope Filters'),
        type: 'select',
        mode: 'multiple',
        options: [
          { label: t('Availability Zones'), value: 'az' },
          { label: t('Host Aggregates'), value: 'agg' },
          { label: t('Compute Nodes'), value: 'nodes' },
          { label: t('Exclude Instances'), value: 'exclude' },
        ],
        onChange: (value) => this.onScopeChange(value),
      },
      {
        name: 'scope_availability_zones',
        label: t('Availability Zones'),
        type: 'select',
        mode: 'multiple',
        options: this.state.availabilityZones,
        hidden: !hasScope('az'),
      },
      {
        name: 'scope_host_aggregates',
        label: t('Host Aggregates'),
        type: 'select',
        mode: 'multiple',
        options: this.state.hostAggregates,
        hidden: !hasScope('agg'),
      },
      {
        name: 'scope_compute_nodes',
        label: t('Compute Nodes'),
        type: 'select',
        mode: 'multiple',
        options: this.state.computeNodes,
        hidden: !hasScope('nodes'),
      },
      {
        name: 'scope_exclude_instances',
        label: t('Instances to Exclude'),
        type: 'select',
        mode: 'multiple',
        options: this.state.instances,
        hidden: !hasScope('exclude'),
      },
    ];
  }

  buildScope(values) {
    const compute = [];
    if (
      values.scope_availability_zones &&
      values.scope_availability_zones.length > 0
    ) {
      compute.push({
        availability_zones: values.scope_availability_zones.map((name) => ({
          name,
        })),
      });
    }
    if (
      values.scope_host_aggregates &&
      values.scope_host_aggregates.length > 0
    ) {
      compute.push({
        host_aggregates: values.scope_host_aggregates.map((id) => ({ id })),
      });
    }
    if (values.scope_compute_nodes && values.scope_compute_nodes.length > 0) {
      compute.push({
        compute_nodes: values.scope_compute_nodes.map((host) => ({ host })),
      });
    }
    if (
      values.scope_exclude_instances &&
      values.scope_exclude_instances.length > 0
    ) {
      compute.push({
        exclude: [
          {
            instances: values.scope_exclude_instances.map((uuid) => ({ uuid })),
          },
        ],
      });
    }
    return compute.length > 0 ? [{ compute }] : [];
  }

  onSubmit = (values) => {
    const body = {
      name: values.name,
      goal: values.goal,
      description: values.description || '',
    };
    if (values.strategy) {
      body.strategy = values.strategy;
    }
    const scope = this.buildScope(values);
    if (scope.length > 0) {
      body.scope = scope;
    }
    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(Create));
