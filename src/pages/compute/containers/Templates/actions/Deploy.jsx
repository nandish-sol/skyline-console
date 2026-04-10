// Copyright 2025-2026 Xloud Technologies Pvt Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
