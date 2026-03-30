import React from 'react';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalAuditStore from 'stores/watcher/audits';
import { watcherEndpoint } from 'client/client/constants';
import { Tag } from 'antd';
import actionConfigs from './actions';

const stateColorMap = {
  SUCCEEDED: 'green',
  FAILED: 'red',
  CANCELLED: 'orange',
  SUSPENDED: 'gold',
  PENDING: 'default',
  ONGOING: 'processing',
};

export class Audits extends Base {
  init() {
    this.store = globalAuditStore;
  }

  get policy() {
    return '';
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
      title: t('Name'),
      dataIndex: 'name',
      routeName: this.getRouteName('watcherAuditDetail'),
    },
    {
      title: t('Audit Type'),
      dataIndex: 'audit_type',
    },
    {
      title: t('State'),
      dataIndex: 'state',
      isStatus: false,
      render: (value) => {
        const color = stateColorMap[value] || 'default';
        return <Tag color={color}>{value}</Tag>;
      },
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
