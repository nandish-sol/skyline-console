import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('State'),
        dataIndex: 'state',
      },
      {
        label: t('Audit UUID'),
        dataIndex: 'audit_uuid',
      },
      {
        label: t('Strategy'),
        dataIndex: 'strategy_name',
      },
      {
        label: t('Global Efficacy'),
        dataIndex: 'global_efficacy',
        render: (value) => {
          if (value && typeof value === 'object') {
            return <pre>{JSON.stringify(value, null, 2)}</pre>;
          }
          return value || '-';
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
      title: t('Base Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
