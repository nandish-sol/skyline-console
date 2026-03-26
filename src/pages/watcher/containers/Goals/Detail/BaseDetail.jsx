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
        label: t('Efficacy Specification'),
        dataIndex: 'efficacy_specification',
        render: (value) => {
          if (Array.isArray(value)) {
            return JSON.stringify(value, null, 2);
          }
          return '-';
        },
      },
    ];

    return {
      title: t('Goal Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
