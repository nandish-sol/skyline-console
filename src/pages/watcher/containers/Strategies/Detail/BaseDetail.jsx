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
        label: t('Display Name'),
        dataIndex: 'display_name',
      },
      {
        label: t('Goal Name'),
        dataIndex: 'goal_name',
      },
      {
        label: t('Goal UUID'),
        dataIndex: 'goal_uuid',
      },
      {
        label: t('Parameters Spec'),
        dataIndex: 'parameters_spec',
        render: (value) => {
          if (value) {
            return JSON.stringify(value, null, 2);
          }
          return '-';
        },
      },
    ];

    return {
      title: t('Strategy Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
