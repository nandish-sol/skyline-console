import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalStrategyStore from 'stores/watcher/strategies';
import { watcherEndpoint } from 'client/client/constants';

export class Strategies extends Base {
  init() {
    this.store = globalStrategyStore;
  }

  get policy() {
    return 'watcher:strategy:get_all';
  }

  get name() {
    return t('Strategies');
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
      routeName: 'watcherStrategyDetail',
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

export default inject('rootStore')(observer(Strategies));
