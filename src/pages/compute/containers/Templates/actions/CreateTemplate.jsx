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
import globalServerStore from 'stores/nova/instance';
import client from 'client';

const CATEGORY_OPTIONS = [
  { label: t('Base OS'), value: 'base-os' },
  { label: t('Web Server'), value: 'web-server' },
  { label: t('Database'), value: 'database' },
  { label: t('Application'), value: 'application' },
  { label: t('Custom'), value: 'custom' },
];

export class CreateTemplate extends ModalAction {
  static id = 'create-template';

  static title = t('Create Template');

  static buttonText = t('Create Template');

  init() {
    this.serverStore = globalServerStore;
    this.fetchInstances();
  }

  async fetchInstances() {
    await this.serverStore.fetchList({
      all_projects: false,
    });
  }

  get name() {
    return t('Create Template');
  }

  get messageHasItemName() {
    return false;
  }

  get instanceName() {
    return this.values.name;
  }

  static policy = '';

  static allowed = () => Promise.resolve(true);

  get instances() {
    return (this.serverStore.list.data || [])
      .filter((s) =>
        ['active', 'stopped', 'shutoff', 'paused'].includes(
          (s.status || '').toLowerCase()
        )
      )
      .map((s) => ({
        value: s.id,
        label: `${s.name} (${s.id.substring(0, 8)})`,
      }));
  }

  get tips() {
    return t(
      'Create a reusable template from an existing instance. ' +
        'This will snapshot the instance and capture its full ' +
        'configuration (flavor, network, security groups, key pair). ' +
        'The source instance will not be affected unless you check ' +
        '"Delete Instance After Conversion".'
    );
  }

  get defaultValue() {
    return {
      xloud_template_version: '1.0',
      xloud_template_category: 'custom',
      delete_instance: false,
    };
  }

  get formItems() {
    return [
      {
        name: 'instance_id',
        label: t('Source Instance'),
        type: 'select',
        options: this.instances,
        required: true,
        isLoading: this.serverStore.list.isLoading,
        tip: t(
          'Select an instance to create a template from. ' +
            'Only Active, Stopped, or Paused instances are shown.'
        ),
      },
      {
        name: 'name',
        label: t('Template Name'),
        type: 'input-name',
        required: true,
      },
      {
        name: 'xloud_template_version',
        label: t('Version'),
        type: 'input',
        required: true,
      },
      {
        name: 'xloud_template_category',
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
        content: t(
          'Warning: The source instance will be permanently ' +
            'deleted after the template is created.'
        ),
      },
    ];
  }

  onSubmit = (values) => {
    const { instance_id, name, delete_instance, ...rest } = values;
    const body = {
      'xloud-convert-template': {
        name,
        delete_instance: delete_instance || false,
        version: rest.xloud_template_version || '1.0',
        category: rest.xloud_template_category || 'custom',
        description: rest.description || '',
      },
    };
    return client.nova.servers.action(instance_id, body);
  };
}

export default inject('rootStore')(observer(CreateTemplate));
