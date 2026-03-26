import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import { watcherEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class AuditTemplates extends Base {
  init() {
    this.store = globalAuditTemplateStore;
  }

  get policy() {
    return 'watcher:audit_template:get_all';
  }

  get name() {
    return t('Audit Templates');
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
      title: t('Name'),
      dataIndex: 'name',
      routeName: 'watcherAuditTemplateDetail',
    },
    {
      title: t('UUID'),
      dataIndex: 'uuid',
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
        label: t('Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(AuditTemplates));
