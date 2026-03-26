import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalSecretsStore from 'stores/barbican/secrets';
import { getOriginEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class Secrets extends Base {
  init() {
    this.store = globalSecretsStore;
  }

  get policy() {
    return 'secret:get';
  }

  get name() {
    return t('Secrets');
  }

  get endpoint() {
    return getOriginEndpoint('barbican');
  }

  get checkEndpoint() {
    return true;
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      routeName: 'barbicanSecretDetail',
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
        if (!value) return '-';
        try {
          const parsed = JSON.parse(value);
          return parsed.domain || value;
        } catch {
          return value;
        }
      },
    },
    {
      title: t('Created'),
      dataIndex: 'created',
      valueRender: 'toLocalTime',
    },
    {
      title: t('Expiration'),
      dataIndex: 'expiration',
      valueRender: 'toLocalTime',
      render: (value) => value || '-',
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(Secrets));
