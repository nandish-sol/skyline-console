import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { ActionStore } from 'stores/watcher/actions';
import BaseDetail from './BaseDetail';

export class ActionDetail extends Base {
  init() {
    this.store = new ActionStore();
  }
get policy() {    return "";  }

  get name() {
    return t('Action Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherActions');
  }


  get detailInfos() {
    return [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
      },
      {
        title: t('Action Type'),
        dataIndex: 'action_type',
      },
      {
        title: t('State'),
        dataIndex: 'state',
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

export default inject('rootStore')(observer(ActionDetail));
