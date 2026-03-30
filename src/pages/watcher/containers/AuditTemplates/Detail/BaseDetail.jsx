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
        label: t('Description'),
        dataIndex: 'description',
      },
      {
        label: t('Goal'),
        dataIndex: 'goal_name',
      },
      {
        label: t('Strategy'),
        dataIndex: 'strategy_name',
      },
      {
        label: t('Scope'),
        dataIndex: 'scope',
        render: (value) => {
          if (value && typeof value === 'object') {
            return <pre>{JSON.stringify(value, null, 2)}</pre>;
          }
          return value || '-';
        },
      },
    ];
    return {
      title: t('Base Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
