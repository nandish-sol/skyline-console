import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { StrategyStore } from 'stores/watcher/strategies';
import BaseDetail from './BaseDetail';

export class StrategyDetail extends Base {
  init() {
    this.store = new StrategyStore();
  }
get policy() {    return "";  }

  get name() {
    return t('Strategy Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherStrategies');
  }


  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
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
  }

  get tabs() {
    return [
      {
        title: t('Detail'),
        key: 'general_info',
        component: BaseDetail,
      },
    ];
  }
}

export default inject('rootStore')(observer(StrategyDetail));
