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
  { label: t('Cache'), value: 'cache' },
  { label: t('Message Queue'), value: 'message-queue' },
  { label: t('Application'), value: 'application' },
  { label: t('Container Host'), value: 'container-host' },
  { label: t('Monitoring'), value: 'monitoring' },
  { label: t('Dev Tools'), value: 'dev-tools' },
  { label: t('ML / AI'), value: 'ml-ai' },
  { label: t('Custom'), value: 'custom' },
];

const EDITABLE_KEYS = [
  'name',
  'xloud_template_name',
  'xloud_template_version',
  'xloud_template_category',
  'description',
  'xloud_template_description',
  'visibility',
  'protected',
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

  get labelCol() {
    return {
      xs: { span: 8 },
      sm: { span: 7 },
    };
  }

  get tips() {
    return t(
      'Editable: name, version, category, description, visibility, protected. ' +
        'Captured VM configuration (flavor, network, security groups, key pair) ' +
        'is read-only — it reflects the source instance at template creation time.'
    );
  }

  get capturedFlavorText() {
    const { item } = this;
    const name = item.xloud_template_flavor_name || '-';
    const v = item.xloud_template_vcpus || '-';
    const r = item.xloud_template_ram_mb || '-';
    const rawDisk = item.xloud_template_disk_gb;
    const diskNum = rawDisk == null || rawDisk === '' ? null : Number(rawDisk);
    const disk =
      diskNum === 0
        ? t('Volume-backed')
        : diskNum == null || Number.isNaN(diskNum)
        ? '-'
        : `${diskNum} GB`;
    return `${name}  (${v} vCPU / ${r} MB / ${disk})`;
  }

  get capturedSecurityGroupsText() {
    const { item } = this;
    try {
      const arr = JSON.parse(item.xloud_template_security_groups || '[]');
      if (Array.isArray(arr) && arr.length) {
        return arr.join(', ');
      }
    } catch (e) {
      // ignore
    }
    return '-';
  }

  get defaultValue() {
    const { item } = this;
    return {
      name: item.xloud_template_name || item.name || '',
      xloud_template_version: item.xloud_template_version || '1.0',
      xloud_template_category: item.xloud_template_category || 'custom',
      description: item.xloud_template_description || item.description || '',
      visibility: item.visibility === 'public',
      protected: item.protected || false,
      captured_flavor: this.capturedFlavorText,
      captured_network: item.xloud_template_network_name || '-',
      captured_security_groups: this.capturedSecurityGroupsText,
      captured_keypair: item.xloud_template_keypair || '-',
      captured_az: item.xloud_template_az || '-',
      captured_source_instance: item.xloud_template_source_instance || '-',
      captured_created_by: item.xloud_template_created_by || '-',
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
        showSearch: true,
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
        name: 'captured_flavor',
        label: t('Flavor'),
        type: 'label',
        iconType: 'flavor',
      },
      {
        name: 'captured_network',
        label: t('Network'),
        type: 'label',
        iconType: 'network',
      },
      {
        name: 'captured_security_groups',
        label: t('Security Groups'),
        type: 'label',
        iconType: 'security',
      },
      {
        name: 'captured_keypair',
        label: t('Key Pair'),
        type: 'label',
        iconType: 'keypair',
      },
      {
        name: 'captured_az',
        label: t('Availability Zone'),
        type: 'label',
      },
      {
        name: 'captured_source_instance',
        label: t('Source Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'captured_created_by',
        label: t('Created By'),
        type: 'label',
        iconType: 'user',
      },
    ];
  }

  onSubmit = (values) => {
    const {
      protected: isProtected = false,
      visibility = false,
      name,
      description,
      xloud_template_version,
      xloud_template_category,
    } = values;
    const newValues = {
      name,
      xloud_template_name: name,
      description: description || '',
      xloud_template_description: description || '',
      xloud_template_version,
      xloud_template_category,
      protected: isProtected,
      visibility: visibility ? 'public' : 'private',
    };
    const changeValues = [];
    Object.keys(newValues).forEach((key) => {
      if (!EDITABLE_KEYS.includes(key)) {
        return;
      }
      const orig = get(this.item.originData, key);
      const next = newValues[key];
      if (orig != null && orig !== next) {
        changeValues.push({ op: 'replace', path: `/${key}`, value: next });
      } else if (
        (orig == null || !has(this.item.originData, key)) &&
        next !== '' &&
        next != null
      ) {
        changeValues.push({ op: 'add', path: `/${key}`, value: next });
      }
    });
    if (changeValues.length === 0) {
      return Promise.resolve();
    }
    return this.store.update({ id: this.item.id }, changeValues);
  };
}

export default inject('rootStore')(observer(Edit));
