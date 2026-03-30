import React from 'react';
import Base from 'containers/BaseDetail';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';

export class BaseDetail extends Base {
  get leftCards() {
    const cards = [this.baseInfoCard];
    return cards;
  }

  get rightCards() {
    return [];
  }

  renderInputParameters(params) {
    if (!params || Object.keys(params).length === 0) return '-';
    return (
      <div>
        {Object.entries(params).map(([key, value]) => {
          if (key === 'resource_id' && value) {
            const path = this.getRoutePath('instanceDetail', { id: value });
            return (
              <div key={key} style={{ marginBottom: 4 }}>
                <strong>{key}:</strong> <Link to={path}>{value}</Link>
              </div>
            );
          }
          if (key === 'resource_name' && value) {
            return (
              <div key={key} style={{ marginBottom: 4 }}>
                <strong>{key}:</strong> {value}
              </div>
            );
          }
          return (
            <div key={key} style={{ marginBottom: 4 }}>
              <strong>{key}:</strong> {String(value)}
            </div>
          );
        })}
      </div>
    );
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Action Type'),
        dataIndex: 'action_type',
      },
      {
        label: t('State'),
        dataIndex: 'state',
      },
      {
        label: t('Action Plan UUID'),
        dataIndex: 'action_plan_uuid',
        render: (value) => {
          if (!value) return '-';
          const path = this.getRoutePath('watcherActionPlanDetail', {
            id: value,
          });
          return <Link to={path}>{value}</Link>;
        },
      },
      {
        label: t('Input Parameters'),
        dataIndex: 'input_parameters',
        render: (value) => this.renderInputParameters(value),
      },
      {
        label: t('Parents'),
        dataIndex: 'parents',
        render: (value) => {
          if (value && value.length > 0) {
            return value.join(', ');
          }
          return '-';
        },
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
      title: t('Action Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
