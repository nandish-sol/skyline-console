import React from 'react';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionPlanStore from 'stores/watcher/actionPlans';
import { watcherEndpoint } from 'client/client/constants';
import { Link } from 'react-router-dom';
import { Tag } from 'antd';
import actionConfigs from './actions';

const stateColorMap = {
  SUCCEEDED: 'green',
  FAILED: 'red',
  CANCELLED: 'orange',
  SUPERSEDED: 'gold',
  RECOMMENDED: 'blue',
  PENDING: 'default',
  ONGOING: 'processing',
  TRIGGERED: 'cyan',
};

export class ActionPlans extends Base {
  init() {
    this.store = globalActionPlanStore;
  }

  get policy() {
    return '';
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('Action Plans');
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
        title: t('UUID'),
        dataIndex: 'uuid',
        isLink: true,
        routeName: this.getRouteName('watcherActionPlanDetail'),
      },
      {
        title: t('Audit UUID'),
        dataIndex: 'audit_uuid',
        isHideable: true,
        render: (value) => {
          if (!value) return '-';
          const path = this.getRoutePath('watcherAuditDetail', { id: value });
          return <Link to={path}>{value}</Link>;
        },
      },
      {
        title: t('State'),
        dataIndex: 'state',
        isHideable: true,
        render: (value) => {
          const color = stateColorMap[value] || 'default';
          return <Tag color={color}>{value}</Tag>;
        },
      },
      {
        title: t('Strategy'),
        dataIndex: 'strategy_name',
        isHideable: true,
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Audit UUID'),
        name: 'audit_uuid',
      },
    ];
  }
}

export default inject('rootStore')(observer(ActionPlans));
