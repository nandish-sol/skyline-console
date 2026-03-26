import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Secret Type'),
        dataIndex: 'secret_type',
      },
      {
        label: t('Status'),
        dataIndex: 'status',
      },
      {
        label: t('Content Types'),
        dataIndex: 'content_types',
        render: (value) => {
          if (value && typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value || '-';
        },
      },
      {
        label: t('Mode'),
        dataIndex: 'mode',
      },
      {
        label: t('Bit Length'),
        dataIndex: 'bit_length',
      },
      {
        label: t('Created'),
        dataIndex: 'created',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Updated'),
        dataIndex: 'updated',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Expiration'),
        dataIndex: 'expiration',
        valueRender: 'toLocalTime',
        render: (value) => value || '-',
      },
    ];
    return {
      title: t('Base Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
