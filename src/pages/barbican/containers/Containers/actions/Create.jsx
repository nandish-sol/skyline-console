import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalContainersStore from 'stores/barbican/containers';
import globalSecretsStore from 'stores/barbican/secrets';

export class Create extends ModalAction {
  static id = 'create-container';

  static title = t('Create Container');

  static policy = 'containers:post';

  static allowed = () => Promise.resolve(true);

  init() {
    this.store = globalContainersStore;
    this.secretsStore = globalSecretsStore;
    this.state = {
      ...this.state,
      secrets: [],
    };
    this.fetchSecrets();
  }

  get name() {
    return t('Create Container');
  }

  async fetchSecrets() {
    try {
      const secrets = await this.secretsStore.fetchList();
      this.setState({ secrets: secrets || [] });
    } catch (e) {
      this.setState({ secrets: [] });
    }
  }

  get secretOptions() {
    const { secrets = [] } = this.state;
    return secrets.map((s) => ({
      label: `${s.name || s.id} (${s.secret_type || 'opaque'})`,
      value: s.secret_ref || s.id,
    }));
  }

  get formItems() {
    return [
      {
        name: 'name',
        label: t('Name'),
        type: 'input',
        required: true,
        placeholder: t('Container name'),
      },
      {
        name: 'type',
        label: t('Type'),
        type: 'select',
        options: [
          { label: t('Generic'), value: 'generic' },
          { label: t('RSA'), value: 'rsa' },
          { label: t('Certificate'), value: 'certificate' },
        ],
        required: true,
        initialValue: 'generic',
      },
      {
        name: 'secret_refs',
        label: t('Secrets'),
        type: 'select',
        mode: 'multiple',
        options: this.secretOptions,
        tip: t('Select secrets to include in this container'),
      },
    ];
  }

  onSubmit = async (values) => {
    const { name, type, secret_refs: selectedRefs = [] } = values;
    const secretRefs = selectedRefs.map((ref, idx) => ({
      name: `secret-${idx + 1}`,
      secret_ref: ref,
    }));
    const data = {
      name,
      type,
      secret_refs: secretRefs,
    };
    return this.store.client.create(data);
  };
}

export default inject('rootStore')(observer(Create));
