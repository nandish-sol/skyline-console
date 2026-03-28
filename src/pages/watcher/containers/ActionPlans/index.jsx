import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionPlanStore from 'stores/watcher/actionPlans';
import { watcherEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class ActionPlans extends Base {
  init() {
    this.store = globalActionPlanStore;
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('Action Plans');
  }

  get rowKey() {
    return 'uuid';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns() {
    return [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
        routeName: this.getRouteName('watcherActionPlanDetail'),
      },
      {
        title: t('Audit UUID'),
        dataIndex: 'audit_uuid',
        isHideable: true,
      },
      {
        title: t('State'),
        dataIndex: 'state',
        isHideable: true,
      },
      {
        title: t('Global Efficacy'),
        dataIndex: 'global_efficacy',
        isHideable: true,
        render: (value) => {
          if (value) {
            return JSON.stringify(value);
          }
          return '-';
        },
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
        isHideable: true,
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Audit UUID'),
        name: 'audit_uuid',
      },
    ];
  }
}

export default inject('rootStore')(observer(ActionPlans));
