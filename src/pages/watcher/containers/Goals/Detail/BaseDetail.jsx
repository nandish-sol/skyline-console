import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';

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
