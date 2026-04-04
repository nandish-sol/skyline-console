import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalSecretsStore from 'stores/barbican/secrets';
import globalSecretStoresStore from 'stores/barbican/secret-stores';
import { getOriginEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class Secrets extends Base {
  init() {
    this.store = globalSecretsStore;
    this.secretStoresStore = globalSecretStoresStore;
    this.fetchSecretStores();
  }

  async fetchSecretStores() {
    try {
      await this.secretStoresStore.fetchList();
    } catch (e) {
      // silently fail
    }
  }

  get defaultStoreName() {
    const stores = this.secretStoresStore.list.data || [];
    const defaultStore = stores.find((s) => s.global_default);
    return defaultStore ? defaultStore.name : '-';
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

  getColumns = () => {
    const columns = [
      {
        title: t('Name'),
        dataIndex: 'name',
        routeName: this.getRouteName('barbicanSecretDetail'),
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
    if (this.isAdminPage) {
      columns.splice(1, 0, {
        title: t('Creator ID'),
        dataIndex: 'creator_id',
        ellipsis: true,
        copyable: true,
        width: 130,
      });
      columns.splice(columns.length - 1, 0, {
        title: t('Content Type'),
        dataIndex: 'content_types',
        render: (val) => (val && val.default) || '-',
      });
      columns.splice(columns.length - 1, 0, {
        title: t('Secret Backend'),
        dataIndex: 'secret_backend',
        render: () => this.defaultStoreName,
      });
    }
    return columns;
  };

  get searchFilters() {
    const filters = [
      {
        label: t('Name'),
        name: 'name',
      },
    ];
    if (this.isAdminPage) {
      filters.push({
        label: t('Secret Type'),
        name: 'secret_type',
        options: [
          { label: t('Opaque'), key: 'opaque' },
          { label: t('Symmetric'), key: 'symmetric' },
          { label: t('Public'), key: 'public' },
          { label: t('Private'), key: 'private' },
          { label: t('Certificate'), key: 'certificate' },
          { label: t('Passphrase'), key: 'passphrase' },
        ],
      });
    }
    return filters;
  }
}

export default inject('rootStore')(observer(Secrets));
