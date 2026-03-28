import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionStore from 'stores/watcher/actions';

export class Actions extends Base {
  init() {
    this.store = globalActionStore;
  }

  get policy() {
    return 'watcher:action:get';
  }

  get name() {
    return t('Actions');
  }

  get rowKey() {
    return 'uuid';
  }

  getColumns() {
    return [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
        routeName: this.getRouteName('watcherActionDetail'),
      },
      {
        title: t('Action Type'),
        dataIndex: 'action_type',
        isHideable: true,
      },
      {
        title: t('State'),
        dataIndex: 'state',
        isHideable: true,
      },
      {
        title: t('Action Plan UUID'),
        dataIndex: 'action_plan_uuid',
        isHideable: true,
      },
      {
        title: t('Input Parameters'),
        dataIndex: 'input_parameters',
        isHideable: true,
        render: (value) => {
          if (value) {
            return JSON.stringify(value);
          }
          return '-';
        },
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Action Plan UUID'),
        name: 'action_plan_uuid',
      },
    ];
  }
}

export default inject('rootStore')(observer(Actions));
