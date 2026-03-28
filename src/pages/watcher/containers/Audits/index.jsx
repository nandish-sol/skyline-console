import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalAuditStore from 'stores/watcher/audits';
import actionConfigs from './actions';

export class Audits extends Base {
  init() {
    this.store = globalAuditStore;
  }

  get policy() {
    return 'watcher:audit:get';
  }

  get name() {
    return t('Audits');
  }

  get rowKey() {
    return 'uuid';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('watcherAuditDetail'),
      },
      {
        title: t('Audit Type'),
        dataIndex: 'audit_type',
        isHideable: true,
      },
      {
        title: t('State'),
        dataIndex: 'state',
        isHideable: true,
      },
      {
        title: t('Goal Name'),
        dataIndex: 'goal_name',
        isHideable: true,
      },
      {
        title: t('Strategy Name'),
        dataIndex: 'strategy_name',
        isHideable: true,
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
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

export default inject('rootStore')(observer(Audits));
