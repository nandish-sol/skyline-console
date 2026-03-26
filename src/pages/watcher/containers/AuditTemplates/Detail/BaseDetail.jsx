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
        label: t('Strategy Name'),
        dataIndex: 'strategy_name',
      },
      {
        label: t('Goal Name'),
        dataIndex: 'goal_name',
      },
      {
        label: t('Description'),
        dataIndex: 'description',
      },
      {
        label: t('Scope'),
        dataIndex: 'scope',
        render: (value) => {
          if (value) {
            return JSON.stringify(value, null, 2);
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
      title: t('Audit Template Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
