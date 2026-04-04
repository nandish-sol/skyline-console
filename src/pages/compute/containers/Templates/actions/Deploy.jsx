import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';

export class Deploy extends ModalAction {
  static id = 'deploy-template';

  static title = t('Deploy');

  static buttonText = t('Deploy');

  static policy = 'os_compute_api:servers:create';

  static allowed = () => Promise.resolve(true);

  get name() {
    return t('Deploy from Template');
  }

  get defaultValue() {
    return {
      template: this.item.templateName || this.item.name,
    };
  }

  get formItems() {
    return [
      {
        name: 'template',
        label: t('Template'),
        type: 'label',
      },
      {
        name: 'name',
        label: t('Instance Name'),
        type: 'input-name',
        required: true,
        isInstance: true,
      },
    ];
  }

  onSubmit = () => {
    const { id } = this.item;
    const url = `/compute/instance/create?image=${id}`;
    this.routing.push(url);
    return Promise.resolve();
  };
}

export default inject('rootStore')(observer(Deploy));
