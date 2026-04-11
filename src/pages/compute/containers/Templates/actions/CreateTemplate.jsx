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
import { has } from 'lodash';
import { ModalAction } from 'containers/Action';
import globalServerStore from 'stores/nova/instance';
import client from 'client';

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

export class CreateTemplate extends ModalAction {
  static id = 'create-template';

  static title = t('Create Template');

  static buttonText = t('Create Template');

  init() {
    this.serverStore = globalServerStore;
    this.state = { ...(this.state || {}), selectedInstance: null };
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

  get labelCol() {
    return {
      xs: { span: 8 },
      sm: { span: 7 },
    };
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

  onValuesChange = (changedFields) => {
    if (has(changedFields, 'instance_id')) {
      const value = changedFields.instance_id;
      const id =
        value && typeof value === 'object' ? value.value || value.id : value;
      const found = (this.serverStore.list.data || []).find((s) => s.id === id);
      this.setState({ selectedInstance: found || null });
    }
  };

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

  getPreviewFields() {
    const inst = this.state && this.state.selectedInstance;
    if (!inst) {
      return [];
    }
    const od = inst.origin_data || {};
    const flavor = inst.flavor_info || inst.flavor || od.flavor || {};
    const flavorName =
      flavor.original_name || flavor.name || inst.flavor_name || '-';
    const vcpus = flavor.vcpus != null ? flavor.vcpus : '-';
    const ram = flavor.ram != null ? flavor.ram : '-';
    const diskNum =
      flavor.disk != null
        ? flavor.disk
        : flavor.root_gb != null
        ? flavor.root_gb
        : null;
    const disk =
      diskNum === 0
        ? t('Volume-backed')
        : diskNum == null
        ? '-'
        : `${diskNum} GB`;
    const addresses = od.addresses || inst.addresses || {};
    const networkNames = Object.keys(addresses);
    const sgs = (od.security_groups || inst.security_groups || [])
      .map((sg) => sg.name)
      .filter(Boolean);
    const az =
      od['OS-EXT-AZ:availability_zone'] ||
      inst['OS-EXT-AZ:availability_zone'] ||
      inst.availability_zone;
    const keyName = od.key_name || inst.key_name;
    return [
      {
        name: 'preview_flavor',
        label: t('Flavor'),
        type: 'label',
        iconType: 'flavor',
        content: `${flavorName}  (${vcpus} vCPU / ${ram} MB / ${disk})`,
      },
      {
        name: 'preview_network',
        label: t('Network'),
        type: 'label',
        iconType: 'network',
        content: networkNames.length ? networkNames.join(', ') : '-',
      },
      {
        name: 'preview_security_groups',
        label: t('Security Groups'),
        type: 'label',
        iconType: 'security',
        content: sgs.length ? sgs.join(', ') : '-',
      },
      {
        name: 'preview_keypair',
        label: t('Key Pair'),
        type: 'label',
        iconType: 'keypair',
        content: keyName || '-',
      },
      {
        name: 'preview_az',
        label: t('Availability Zone'),
        type: 'label',
        content: az || '-',
      },
      {
        name: 'preview_status',
        label: t('Current Status'),
        type: 'label',
        content: (inst.status || '-').toString().toUpperCase(),
      },
    ];
  }

  get formItems() {
    return [
      {
        name: 'instance_id',
        label: t('Source Instance'),
        type: 'select',
        options: this.instances,
        required: true,
        showSearch: true,
        isLoading: this.serverStore.list.isLoading,
        tip: t(
          'Select an instance to create a template from. ' +
            'Only Active, Stopped, or Paused instances are shown.'
        ),
      },
      ...this.getPreviewFields(),
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
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
      {
        name: 'delete_instance',
        label: t('Delete Source'),
        type: 'check',
        content: t(
          'Delete the source instance after the template is created. ' +
            'This cannot be undone.'
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
