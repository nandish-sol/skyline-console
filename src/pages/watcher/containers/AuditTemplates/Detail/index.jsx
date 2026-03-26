import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { AuditTemplateStore } from 'stores/watcher/auditTemplates';
import BaseDetail from './BaseDetail';
import actionConfigs from '../actions';

export class AuditTemplateDetail extends Base {
  init() {
    this.store = new AuditTemplateStore();
  }

  get name() {
    return t('Audit Template Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherAuditTemplates');
  }

  get policy() {
    return 'watcher:audit_template:get';
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

export default inject('rootStore')(observer(AuditTemplateDetail));
