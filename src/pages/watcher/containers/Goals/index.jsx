import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalGoalStore from 'stores/watcher/goals';
import { watcherEndpoint } from 'client/client/constants';

export class Goals extends Base {
  init() {
    this.store = globalGoalStore;
  }

  get policy() {
    return 'watcher:goal:get_all';
  }

  get name() {
    return t('Goals');
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

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      routeName: 'watcherGoalDetail',
    },
    {
      title: t('Display Name'),
      dataIndex: 'display_name',
    },
    {
      title: t('UUID'),
      dataIndex: 'uuid',
    },
  ];

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
