import React from 'react';
import Base from 'containers/BaseDetail';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { Table } from 'antd';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard, this.efficacyCard, this.actionsCard];
  }

  get rightCards() {
    return [];
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
      },
      {
        title: t('State'),
        dataIndex: 'state',
        key: 'state',
      },
      {
        title: t('Action Plan'),
        dataIndex: 'action_plan_uuid',
        key: 'action_plan_uuid',
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
