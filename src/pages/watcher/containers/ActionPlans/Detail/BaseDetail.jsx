import React from 'react';
import Base from 'containers/BaseDetail';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Table, Tag } from 'antd';

const STATE_COLORS = {
  SUCCEEDED: 'green',
  FAILED: 'red',
  PENDING: 'default',
  ONGOING: 'processing',
  CANCELLED: 'orange',
  RECOMMENDED: 'blue',
};

export class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard, this.efficacyCard, this.actionsCard];
  }

  get rightCards() {
    return [];
  }

  get leftCardsStyle() {
    return { width: '100%', maxWidth: '100%', flex: 'none' };
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('State'),
        dataIndex: 'state',
      },
      {
        label: t('Audit ID'),
        dataIndex: 'audit_uuid',
        render: (value) => {
          if (!value) return '-';
          const path = this.getRoutePath('watcherAuditDetail', { id: value });
          return <Link to={path}>{value}</Link>;
        },
      },
      {
        label: t('Strategy Name'),
        dataIndex: 'strategy_name',
      },
      {
        label: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Updated At'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
    ];

    return {
      title: t('Action Plan Overview'),
      options,
    };
  }

  get efficacyCard() {
    const { global_efficacy } = this.detailData || {};
    const items = (global_efficacy || []).map((item, index) => ({
      ...item,
      key: index,
      unit: item.unit || '-',
    }));

    const columns = [
      {
        title: t('Name'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: t('Unit'),
        dataIndex: 'unit',
        key: 'unit',
      },
      {
        title: t('Value'),
        dataIndex: 'value',
        key: 'value',
      },
    ];

    return {
      title: t('Related Efficacy Indicators'),
      render: () => (
        <div>
          <div style={{ marginBottom: 8, color: '#0068ff' }}>
            {t('Displaying {count} items', { count: items.length })}
          </div>
          <Table
            columns={columns}
            dataSource={items}
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: t('No efficacy data') }}
          />
        </div>
      ),
    };
  }

  get actionsCard() {
    const { actions } = this.detailData || {};
    const items = (actions || []).map((item, index) => ({
      ...item,
      key: index,
    }));

    const columns = [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
        key: 'uuid',
        render: (value) => {
          if (!value) return '-';
          const path = this.getRoutePath('watcherActionDetail', { id: value });
          return <Link to={path}>{value}</Link>;
        },
      },
      {
        title: t('Type'),
        dataIndex: 'action_type',
        key: 'action_type',
        render: (v) => {
          const colors = {
            migrate: 'blue',
            change_nova_service_state: 'purple',
            resize: 'cyan',
          };
          return <Tag color={colors[v] || 'default'}>{v}</Tag>;
        },
      },
      {
        title: t('State'),
        dataIndex: 'state',
        key: 'state',
        render: (v) => <Tag color={STATE_COLORS[v] || 'default'}>{v}</Tag>,
      },
      {
        title: t('Details'),
        dataIndex: 'input_parameters',
        key: 'details',
        render: (val, rec) => {
          if (!val || !Object.keys(val).length) return '-';
          if (rec.action_type === 'migrate') {
            return `${val.source_node || '?'} \u2192 ${
              val.destination_node || '?'
            }`;
          }
          if (rec.action_type === 'change_nova_service_state') {
            return `${val.state || '?'} service`;
          }
          return JSON.stringify(val);
        },
      },
    ];

    return {
      title: t('Related Actions'),
      render: () => (
        <div>
          <div style={{ marginBottom: 8, color: '#0068ff' }}>
            {t('Displaying {count} items', { count: items.length })}
          </div>
          <Table
            columns={columns}
            dataSource={items}
            pagination={false}
            size="small"
            bordered
            locale={{ emptyText: t('No actions') }}
          />
        </div>
      ),
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
