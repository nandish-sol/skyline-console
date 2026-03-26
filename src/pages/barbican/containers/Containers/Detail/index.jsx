import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { ContainersStore } from 'stores/barbican/containers';
import BaseDetail from './BaseDetail';
import actionConfigs from '../actions';

export class ContainerDetail extends Base {
  init() {
    this.store = new ContainersStore();
  }

  get name() {
    return t('Container Detail');
  }

  get listUrl() {
    return this.getRoutePath('barbicanContainers');
  }

  get policy() {
    return 'container:get';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Type'),
        dataIndex: 'type',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
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

export default inject('rootStore')(observer(ContainerDetail));
