import Base from 'containers/BaseDetail';
import { inject, observer } from 'mobx-react';

export class BaseDetail extends Base {
  get leftCards() {
    const cards = [this.baseInfoCard];
    return cards;
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Audit Type'),
        dataIndex: 'audit_type',
      },
      {
        label: t('State'),
        dataIndex: 'state',
      },
      {
        label: t('Goal Name'),
        dataIndex: 'goal_name',
      },
      {
        label: t('Strategy Name'),
        dataIndex: 'strategy_name',
      },
      {
        label: t('Parameters'),
        dataIndex: 'parameters',
        render: (value) => {
          if (value) {
            return JSON.stringify(value, null, 2);
          }
          return '-';
        },
      },
      {
        label: t('Interval'),
        dataIndex: 'interval',
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
      title: t('Audit Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
