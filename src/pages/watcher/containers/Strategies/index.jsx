import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalStrategyStore from 'stores/watcher/strategies';
import { watcherEndpoint } from 'client/client/constants';

export class Strategies extends Base {
  init() {
    this.store = globalStrategyStore;
  }

  get policy() {
    return 'watcher:strategy:get';
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('Strategies');
  }

  get rowKey() {
    return 'uuid';
  }

  getColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('watcherStrategyDetail'),
      },
      {
        title: t('Display Name'),
        dataIndex: 'display_name',
        isHideable: true,
      },
      {
        title: t('Goal Name'),
        dataIndex: 'goal_name',
        isHideable: true,
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

export default inject('rootStore')(observer(Strategies));
