import React from 'react';
import Base from 'containers/List';
import { inject, observer } from 'mobx-react';
import { Tag } from 'antd';
import { ActionStore } from 'stores/watcher/actions';

const STATE_COLORS = {
  SUCCEEDED: 'green',
  FAILED: 'red',
  PENDING: 'default',
  ONGOING: 'processing',
  CANCELLED: 'orange',
};

export class ActionsList extends Base {
  init() {
    this.store = new ActionStore();
  }

  get policy() {
    return '';
  }

  get name() {
    return t('Actions');
  }

  get rowKey() {
    return 'uuid';
  }

  get paramsFunc() {
    return (params) => {
      const { all_projects, ...rest } = params;
      return rest;
    };
  }

  updateFetchParams = (params) => {
    const { id, ...rest } = params;
    return {
      ...rest,
      action_plan_uuid: id,
    };
  };

  getColumns = () => [
    {
      title: t('Action Type'),
      dataIndex: 'action_type',
      render: (value) => {
        const colors = {
          migrate: 'blue',
          change_nova_service_state: 'purple',
          resize: 'cyan',
          nop: 'default',
        };
        return <Tag color={colors[value] || 'default'}>{value}</Tag>;
      },
    },
    {
      title: t('State'),
      dataIndex: 'state',
      render: (value) => (
        <Tag color={STATE_COLORS[value] || 'default'}>{value}</Tag>
      ),
    },
    {
      title: t('Details'),
      dataIndex: 'input_parameters',
      render: (value, record) => {
        if (!value || Object.keys(value).length === 0) return '-';
        if (record.action_type === 'migrate') {
          const src = value.source_node || '-';
          const dst = value.destination_node || '-';
          const vm = value.resource_id
            ? value.resource_id.substring(0, 8)
            : '-';
          return `${src} \u2192 ${dst} (VM: ${vm}...)`;
        }
        if (record.action_type === 'change_nova_service_state') {
          const host = value.resource_id
            ? value.resource_id.substring(0, 8)
            : '-';
          return `${value.state || '-'} (${host}...)`;
        }
        return JSON.stringify(value);
      },
    },
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      isLink: true,
      routeName: this.getRouteName('watcherActionDetail'),
      render: (value) => (value ? value.substring(0, 8) : '-'),
    },
  ];
}

export default inject('rootStore')(observer(ActionsList));
