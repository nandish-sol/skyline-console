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
      },
      {
        label: t('Input Parameters'),
        dataIndex: 'input_parameters',
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
      title: t('Action Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
