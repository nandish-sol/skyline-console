import { inject, observer } from 'mobx-react';
import Base from 'containers/TabDetail';
import { SecretsStore } from 'stores/barbican/secrets';
import BaseDetail from './BaseDetail';
import actionConfigs from '../actions';

export class SecretDetail extends Base {
  init() {
    this.store = new SecretsStore();
  }

  get name() {
    return t('Secret Detail');
  }

  get listUrl() {
    return this.getRoutePath('barbicanSecrets');
  }

  get policy() {
    return 'secret:get';
  }

  get actionConfigs() {
    return actionConfigs;
  }

  get detailInfos() {
    return [
      {
        title: t('Name'),
        dataIndex: 'name',
      },
      {
        title: t('Secret Type'),
        dataIndex: 'secret_type',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
      },
      {
        title: t('Algorithm'),
        dataIndex: 'algorithm',
        render: (value) => {
          if (
            !value ||
            (typeof value === 'object' && Object.keys(value).length === 0)
          ) {
            return '-';
          }
          return String(value);
        },
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('Detail'),
        key: 'general_info',
        component: BaseDetail,
      },
    ];
  }
}

export default inject('rootStore')(observer(SecretDetail));
