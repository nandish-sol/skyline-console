import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalSecretsStore from 'stores/barbican/secrets';
import globalSecretStoresStore from 'stores/barbican/secret-stores';

const ALGORITHM_OPTIONS = {
  opaque: [],
  symmetric: [
    { label: 'AES', value: 'aes' },
    { label: 'DES', value: 'des' },
    { label: '3DES', value: '3des' },
  ],
  public: [
    { label: 'RSA', value: 'rsa' },
    { label: 'DSA', value: 'dsa' },
    { label: 'EC', value: 'ec' },
  ],
  private: [
    { label: 'RSA', value: 'rsa' },
    { label: 'DSA', value: 'dsa' },
    { label: 'EC', value: 'ec' },
  ],
  certificate: [
    { label: 'RSA', value: 'rsa' },
    { label: 'EC', value: 'ec' },
  ],
  passphrase: [],
};

const BIT_LENGTH_OPTIONS = {
  aes: [
    { label: '128', value: 128 },
    { label: '192', value: 192 },
    { label: '256', value: 256 },
  ],
  des: [{ label: '56', value: 56 }],
  '3des': [{ label: '168', value: 168 }],
  rsa: [
    { label: '2048', value: 2048 },
    { label: '3072', value: 3072 },
    { label: '4096', value: 4096 },
  ],
  dsa: [
    { label: '2048', value: 2048 },
    { label: '3072', value: 3072 },
  ],
  ec: [
    { label: '256', value: 256 },
    { label: '384', value: 384 },
    { label: '521', value: 521 },
  ],
};

const MODE_OPTIONS = [
  { label: 'CBC', value: 'cbc' },
  { label: 'CTR', value: 'ctr' },
  { label: 'GCM', value: 'gcm' },
];

const PAYLOAD_HINTS = {
  opaque: t('Any text or data: API key, password, config value, token'),
  symmetric: t('Base64-encoded key. Generate: openssl rand -base64 32'),
  public: t('PEM format: -----BEGIN PUBLIC KEY-----'),
  private: t('PEM format: -----BEGIN RSA PRIVATE KEY-----'),
  certificate: t('PEM format: -----BEGIN CERTIFICATE-----'),
  passphrase: t('A passphrase or password string'),
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
      algorithm: undefined,
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
    const { secretType = 'opaque', algorithm } = this.state;
    const algoOptions = ALGORITHM_OPTIONS[secretType] || [];
    const bitOptions = algorithm ? BIT_LENGTH_OPTIONS[algorithm] || [] : [];
    const showAlgorithm = algoOptions.length > 0;
    const showBitLength = bitOptions.length > 0;
    const showMode = secretType === 'symmetric';
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
          this.setState({ secretType: val, algorithm: undefined });
        },
      },
      {
        name: 'algorithm',
        label: t('Algorithm'),
        type: 'select',
        options: algoOptions,
        hidden: !showAlgorithm,
        onChange: (val) => {
          this.setState({ algorithm: val });
        },
      },
      {
        name: 'bit_length',
        label: t('Bit Length'),
        type: 'select',
        options: bitOptions,
        hidden: !showBitLength,
      },
      {
        name: 'mode',
        label: t('Mode'),
        type: 'select',
        options: MODE_OPTIONS,
        hidden: !showMode,
        tip: t('Block cipher mode (for symmetric keys)'),
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
        name: 'expiration',
        label: t('Expiration'),
        type: 'date-picker',
        showTime: true,
        tip: t('Optional expiration date for this secret'),
      },
      {
        name: 'payload',
        label: t('Payload'),
        type: 'textarea',
        extra: hint,
      },
      {
        name: 'payload_content_type',
        label: t('Payload Content Type'),
        type: 'select',
        options: [
          { label: 'text/plain', value: 'text/plain' },
          {
            label: 'application/octet-stream',
            value: 'application/octet-stream',
          },
          { label: 'application/pkix-cert', value: 'application/pkix-cert' },
        ],
        tip: t('Required when payload is provided'),
      },
    ];
  }

  onSubmit = async (values) => {
    const { secret_store, ...secretData } = values;
    const body = { ...secretData };

    if (body.expiration) {
      body.expiration = body.expiration.toISOString();
    }

    if (!body.payload) {
      delete body.payload;
      delete body.payload_content_type;
    } else if (!body.payload_content_type) {
      body.payload_content_type =
        CONTENT_TYPE_MAP[body.secret_type] || 'text/plain';
    }

    if (!body.algorithm) delete body.algorithm;
    if (!body.bit_length) delete body.bit_length;
    if (!body.mode) delete body.mode;
    if (!body.expiration) delete body.expiration;

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
          // Best effort
        }
      }
    }
  };
}

export default inject('rootStore')(observer(Create));
