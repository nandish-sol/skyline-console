import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalSecretsStore from 'stores/barbican/secrets';
import globalSecretStoresStore from 'stores/barbican/secret-stores';

const PAYLOAD_HINTS = {
  opaque: t('Any text or data: API key, password, config value, token'),
  symmetric: t('Base64-encoded key. Generate with: openssl rand -base64 32'),
  public: t('PEM format: must start with -----BEGIN PUBLIC KEY-----'),
  private: t('PEM format: must start with -----BEGIN RSA PRIVATE KEY-----'),
  certificate: t('PEM format: must start with -----BEGIN CERTIFICATE-----'),
  passphrase: t('A passphrase or password string'),
};

const PAYLOAD_PLACEHOLDERS = {
  opaque: 'my-api-key-or-secret-value',
  symmetric: 'dGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIGtleQ==',
  public: '-----BEGIN PUBLIC KEY-----\nMIIBIjAN...',
  private: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIB...',
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDXTCC...',
  passphrase: 'my-secure-passphrase',
};

const PAYLOAD_VALIDATORS = {
  symmetric: (val) => {
    const b64 = /^[A-Za-z0-9+/\n\r]+=*$/;
    return b64.test(val.trim())
      ? null
      : t('Symmetric key must be Base64-encoded');
  },
  public: (val) =>
    val.trim().startsWith('-----BEGIN')
      ? null
      : t('Public key must be PEM-encoded (-----BEGIN ... -----)'),
  private: (val) =>
    val.trim().startsWith('-----BEGIN')
      ? null
      : t('Private key must be PEM-encoded (-----BEGIN ... -----)'),
  certificate: (val) =>
    val.trim().startsWith('-----BEGIN')
      ? null
      : t('Certificate must be PEM-encoded (-----BEGIN CERTIFICATE-----)'),
};

const CONTENT_TYPE_MAP = {
  symmetric: 'application/octet-stream',
  certificate: 'application/pkix-cert',
};

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
      secretType: 'opaque',
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
    const { secretType = 'opaque' } = this.state;
    const hint = PAYLOAD_HINTS[secretType] || PAYLOAD_HINTS.opaque;

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
        onChange: (val) => {
          this.setState({ secretType: val });
        },
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
        extra: hint,
        placeholder: PAYLOAD_PLACEHOLDERS[secretType] || '',
        validator: (rule, val) => {
          if (!val) return Promise.resolve();
          const validate = PAYLOAD_VALIDATORS[secretType];
          if (!validate) return Promise.resolve();
          const err = validate(val);
          return err ? Promise.reject(new Error(err)) : Promise.resolve();
        },
      },
    ];
  }

  onSubmit = async (values) => {
    const { secret_store, ...secretData } = values;
    const body = { ...secretData };
    if (!body.payload) {
      delete body.payload;
      delete body.payload_content_type;
    } else {
      body.payload_content_type =
        CONTENT_TYPE_MAP[body.secret_type] || 'text/plain';
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
