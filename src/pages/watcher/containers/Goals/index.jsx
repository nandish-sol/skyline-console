import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalGoalStore from 'stores/watcher/goals';
import { watcherEndpoint } from 'client/client/constants';

export class Goals extends Base {
  init() {
    this.store = globalGoalStore;
  }

  get policy() {
    return 'watcher:goal:get';
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('Goals');
  }

  get rowKey() {
    return 'uuid';
  }

  getColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('watcherGoalDetail'),
      },
      {
        title: t('Display Name'),
        dataIndex: 'display_name',
        isHideable: true,
      },
      {
        title: t('Efficacy Specification'),
        dataIndex: 'efficacy_specification',
        isHideable: true,
        render: (value) => {
          if (Array.isArray(value)) {
            return value.length;
          }
          return 0;
        },
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(Goals));
