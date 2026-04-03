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
import globalImageStore from 'stores/glance/image';
import { has, get } from 'lodash';

const CATEGORY_OPTIONS = [
  { label: t('Base OS'), value: 'base-os' },
  { label: t('Web Server'), value: 'web-server' },
  { label: t('Database'), value: 'database' },
  { label: t('Application'), value: 'application' },
  { label: t('Custom'), value: 'custom' },
];

export class Edit extends ModalAction {
  init() {
    this.store = globalImageStore;
  }

  static id = 'template-edit';

  static title = t('Edit Template');

  static buttonText = t('Edit');

  get name() {
    return t('edit template');
  }

  static policy = '';

  static allowed = (item) => Promise.resolve(item.status === 'active');

  get defaultValue() {
    const { item } = this;
    return {
      name: item.xloud_template_name || item.name || '',
      xloud_template_version: item.xloud_template_version || '1.0',
      xloud_template_category: item.xloud_template_category || 'custom',
      description: item.description || '',
      visibility: item.visibility === 'public',
      protected: item.protected || false,
      xloud_template_flavor_name: item.xloud_template_flavor_name || '',
      xloud_template_vcpus: item.xloud_template_vcpus || '',
      xloud_template_ram_mb: item.xloud_template_ram_mb || '',
      xloud_template_disk_gb: item.xloud_template_disk_gb || '',
      xloud_template_network_name: item.xloud_template_network_name || '',
      xloud_template_keypair: item.xloud_template_keypair || '',
      xloud_template_az: item.xloud_template_az || '',
    };
  }

  get formItems() {
    return [
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
        required: true,
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
        maxLength: 255,
      },
      {
        name: 'visibility',
        label: t('Visibility'),
        type: 'check',
        content: t('Public'),
        hidden: !this.isAdminPage,
      },
      {
        name: 'protected',
        label: t('Protected'),
        type: 'check',
        content: t('Protected'),
      },
      {
        name: 'xloud_template_flavor_name',
        label: t('Flavor'),
        type: 'input',
      },
      {
        name: 'xloud_template_vcpus',
        label: t('vCPUs'),
        type: 'input',
      },
      {
        name: 'xloud_template_ram_mb',
        label: t('RAM (MB)'),
        type: 'input',
      },
      {
        name: 'xloud_template_disk_gb',
        label: t('Disk (GB)'),
        type: 'input',
      },
      {
        name: 'xloud_template_network_name',
        label: t('Network'),
        type: 'input',
      },
      {
        name: 'xloud_template_keypair',
        label: t('Key Pair'),
        type: 'input',
      },
      {
        name: 'xloud_template_az',
        label: t('Availability Zone'),
        type: 'input',
      },
    ];
  }

  onSubmit = (values) => {
    const {
      protected: isProtected = false,
      visibility = false,
      name,
      ...rest
    } = values;
    const newValues = {
      ...rest,
      name,
      xloud_template_name: name,
      protected: isProtected,
      visibility: visibility ? 'public' : 'private',
    };
    const changeValues = [];
    Object.keys(newValues).forEach((key) => {
      const orig = get(this.item.originData, key);
      const isNew = newValues[key];
      if (orig != null && orig !== newValues[key] && isNew) {
        changeValues.push({
          op: 'replace',
          path: `/${key}`,
          value: newValues[key],
        });
      } else if ((orig == null || !has(this.item.originData, key)) && isNew) {
        changeValues.push({
          op: 'add',
          path: `/${key}`,
          value: newValues[key],
        });
      }
    });
    if (changeValues.length === 0) {
      return Promise.resolve();
    }
    return this.store.update({ id: this.item.id }, changeValues);
  };
}

export default inject('rootStore')(observer(Edit));
