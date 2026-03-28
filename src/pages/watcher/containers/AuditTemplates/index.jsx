import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalAuditTemplateStore from 'stores/watcher/auditTemplates';
import actionConfigs from './actions';

export class AuditTemplates extends Base {
  init() {
    this.store = globalAuditTemplateStore;
  }

  get name() {
    return t('Audit Templates');
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
        routeName: this.getRouteName('watcherAuditTemplateDetail'),
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
        title: t('Scope'),
        dataIndex: 'scope',
        isHideable: true,
        render: (value) => {
          if (value) {
            return JSON.stringify(value);
          }
          return '-';
        },
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

export default inject('rootStore')(observer(AuditTemplates));
