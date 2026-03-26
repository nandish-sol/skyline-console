import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalSecretsStore from 'stores/barbican/secrets';

export class Create extends ModalAction {
  static id = 'create-secret';

  static title = t('Create Secret');

  static policy = 'secret:put';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalSecretsStore;
  }

  get name() {
    return t('Create Secret');
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
        name: 'payload',
        label: t('Payload'),
        type: 'textarea',
        tip: t('The secret data to store'),
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
        hidden: !this.formRef?.current?.getFieldValue('payload'),
      },
    ];
  }

  onSubmit = (values) => {
    const body = { ...values };
    if (!body.payload) {
      delete body.payload;
      delete body.payload_content_type;
    }
    return this.store.create(body);
  };
}

export default inject('rootStore')(observer(Create));
