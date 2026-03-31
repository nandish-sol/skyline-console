import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalSecretsStore from 'stores/barbican/secrets';
import globalSecretStoresStore from 'stores/barbican/secret-stores';

export class Create extends ModalAction {
  static id = 'create-secret';

  static title = t('Create Secret');

  static policy = 'secret:put';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalSecretsStore;
    this.secretStoresStore = globalSecretStoresStore;
    this.state = {
      ...this.state,
      secretStores: [],
      storesLoaded: false,
    };
    this.fetchSecretStores();
  }

  get name() {
    return t('Create Secret');
  }

  async fetchSecretStores() {
    try {
      const stores = await this.secretStoresStore.fetchList();
      this.setState({
        secretStores: stores || [],
        storesLoaded: true,
      });
    } catch (e) {
      this.setState({ storesLoaded: true });
    }
  }

  get secretStoreOptions() {
    const { secretStores = [] } = this.state;
    return secretStores.map((s) => ({
      label: `${s.name}${s.global_default ? ` (${t('Default')})` : ''}`,
      value: s.id,
    }));
  }

  get hasMultipleStores() {
    return this.secretStoreOptions.length > 1;
  }

  get defaultStoreId() {
    const { secretStores = [] } = this.state;
    const defaultStore = secretStores.find((s) => s.global_default);
    return defaultStore ? defaultStore.id : '';
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input',
        required: true,
      },
      {
        name: 'secret_type',
        label: t('Secret Type'),
        type: 'select',
        options: [
          { label: t('Opaque'), value: 'opaque' },
          { label: t('Symmetric'), value: 'symmetric' },
          { label: t('Public'), value: 'public' },
          { label: t('Private'), value: 'private' },
          { label: t('Certificate'), value: 'certificate' },
          { label: t('Passphrase'), value: 'passphrase' },
        ],
        required: true,
      },
      {
        name: 'secret_store',
        label: t('Secret Store Backend'),
        type: 'select',
        options: this.secretStoreOptions,
        hidden: !this.hasMultipleStores,
        tip: t(
          'Select which backend stores this secret. Default is the built-in crypto store.'
        ),
      },
      {
        name: 'payload',
        label: t('Payload'),
        type: 'textarea',
        tip: t('The secret data to store'),
      },
    ];
  }

  onSubmit = async (values) => {
    const { secret_store, ...secretData } = values;
    const body = { ...secretData };
    if (!body.payload) {
      delete body.payload;
      delete body.payload_content_type;
    } else if (!body.payload_content_type) {
      const typeMap = {
        symmetric: 'application/octet-stream',
        certificate: 'application/pkix-cert',
      };
      body.payload_content_type = typeMap[body.secret_type] || 'text/plain';
    }

    const selectedStoreId = secret_store;
    const needsSwitch =
      this.hasMultipleStores &&
      selectedStoreId &&
      selectedStoreId !== this.defaultStoreId;

    if (needsSwitch) {
      await this.secretStoresStore.setPreferred(selectedStoreId);
    }

    try {
      const result = await this.store.create(body);
      return result;
    } finally {
      if (needsSwitch) {
        try {
          await this.secretStoresStore.removePreferred(selectedStoreId);
        } catch (e) {
          // Best effort — preferred store cleanup
        }
      }
    }
  };
}

export default inject('rootStore')(observer(Create));
