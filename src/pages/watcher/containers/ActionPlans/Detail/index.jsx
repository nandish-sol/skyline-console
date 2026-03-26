import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { ActionPlanStore } from 'stores/watcher/actionPlans';
import actionConfigs from '../actions';
import BaseDetail from './BaseDetail';

export class ActionPlanDetail extends Base {
  init() {
    this.store = new ActionPlanStore();
  }

  get name() {
    return t('Action Plan Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherActionPlans');
  }

  get policy() {
    return 'watcher:action_plan:get';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get detailInfos() {
    return [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
      },
      {
        title: t('State'),
        dataIndex: 'state',
      },
      {
        title: t('Audit UUID'),
        dataIndex: 'audit_uuid',
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

export default inject('rootStore')(observer(ActionPlanDetail));
