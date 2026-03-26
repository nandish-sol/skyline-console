import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionPlanStore from 'stores/watcher/actionPlans';
import { watcherEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class ActionPlans extends Base {
  init() {
    this.store = globalActionPlanStore;
  }

  get policy() {
    return 'watcher:action_plan:get_all';
  }

  get name() {
    return t('Action Plans');
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get rowKey() {
    return 'uuid';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      routeName: 'watcherActionPlanDetail',
    },
    {
      title: t('State'),
      dataIndex: 'state',
    },
    {
      title: t('Audit UUID'),
      dataIndex: 'audit_uuid',
    },
    {
      title: t('Global Efficacy'),
      dataIndex: 'global_efficacy',
      render: (value) => {
        if (value && typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value || '-';
      },
    },
    {
      title: t('Created At'),
      dataIndex: 'created_at',
      valueRender: 'toLocalTime',
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('State'),
        name: 'state',
      },
    ];
  }
}

export default inject('rootStore')(observer(ActionPlans));
