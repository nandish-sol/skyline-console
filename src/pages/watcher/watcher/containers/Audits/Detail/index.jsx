import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { AuditStore } from 'stores/watcher/audits';
import actionConfigs from '../actions';
import BaseDetail from './BaseDetail';

export class AuditDetail extends Base {
  init() {
    this.store = new AuditStore();
  }
get policy() {    return "";  }

  get name() {
    return t('Audit Detail');
  }

  get listUrl() {
    return this.getRoutePath('watcherAudits');
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
        title: t('Audit Type'),
        dataIndex: 'audit_type',
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

export default inject('rootStore')(observer(AuditDetail));
