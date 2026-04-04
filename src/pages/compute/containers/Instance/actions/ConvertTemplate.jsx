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
import client from 'client';

const CATEGORY_OPTIONS = [
  { label: t('Base OS'), value: 'base-os' },
  { label: t('Web Server'), value: 'web-server' },
  { label: t('Database'), value: 'database' },
  { label: t('Application'), value: 'application' },
  { label: t('Custom'), value: 'custom' },
];

export class ConvertTemplate extends ModalAction {
  static id = 'convert-template';

  static title = t('Convert to Template');

  static policy = '';

  static isDanger = true;

  static allowed = (item) =>
    Promise.resolve(
      ['active', 'stopped', 'shutoff', 'paused'].includes(
        (item.status || '').toLowerCase()
      )
    );

  get name() {
    return t('Convert to Template');
  }

  get instanceName() {
    return this.values.template_name;
  }

  get defaultValue() {
    const { name } = this.item;
    return {
      instance: name,
      template_name: `${name}-template`,
      version: '1.0',
      category: 'custom',
      delete_instance: false,
    };
  }

  get tips() {
    return t(
      'Create a reusable template from this instance. Captures disk and configuration (flavor, network, security groups, key pair).'
    );
  }

  get formItems() {
    return [
      {
        name: 'instance',
        label: t('Source Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'template_name',
        label: t('Template Name'),
        type: 'input',
        required: true,
      },
      {
        name: 'version',
        label: t('Version'),
        type: 'input',
        required: true,
      },
      {
        name: 'category',
        label: t('Category'),
        type: 'select',
        options: CATEGORY_OPTIONS,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      {
        name: 'delete_instance',
        label: t('Delete Instance After Conversion'),
        type: 'check',
        tip: t(
          'If checked, the source instance will be permanently deleted ' +
            'after the template is created. This cannot be undone.'
        ),
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const body = {
      'xloud-convert-template': {
        name: values.template_name,
        version: values.version || '1.0',
        category: values.category || 'custom',
        description: values.description || '',
        delete_instance: !!values.delete_instance,
      },
    };
    return client.nova.servers.action(id, body);
  };
}

export default inject('rootStore')(observer(ConvertTemplate));
