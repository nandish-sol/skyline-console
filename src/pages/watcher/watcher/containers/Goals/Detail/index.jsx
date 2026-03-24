import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { GoalStore } from 'stores/watcher/goals';
import BaseDetail from './BaseDetail';

export class GoalDetail extends Base {
  init() {
    this.store = new GoalStore();
  }
get policy() {    return "";  }

  get name() {
    return t('Goal Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherGoals');
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

export default inject('rootStore')(observer(GoalDetail));
