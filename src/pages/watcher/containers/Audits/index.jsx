import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalAuditStore from 'stores/watcher/audits';
import { watcherEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class Audits extends Base {
  init() {
    this.store = globalAuditStore;
  }

  get policy() {
    return 'watcher:audit:get_all';
  }

  get name() {
    return t('Audits');
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

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      routeName: 'watcherAuditDetail',
    },
    {
      title: t('Audit Type'),
      dataIndex: 'audit_type',
    },
    {
      title: t('State'),
      dataIndex: 'state',
    },
    {
      title: t('Goal'),
      dataIndex: 'goal_name',
    },
    {
      title: t('Strategy'),
      dataIndex: 'strategy_name',
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('State'),
        name: 'state',
      },
    ];
  }
}

export default inject('rootStore')(observer(Audits));
