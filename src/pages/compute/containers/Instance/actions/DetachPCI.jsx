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
import { checkStatus, isNotLockedOrAdmin } from 'resources/nova/instance';
import client from 'client';

export class DetachPCI extends ModalAction {
  static id = 'detach-pci';

  static title = t('Detach PCI Device');

  static buttonText = t('Detach PCI Device');

  static isDanger = true;

  init() {
    this.state = {
      ...this.state,
      attachedDevices: [],
      loading: true,
    };
    this.fetchAttachedDevices();
  }

  get name() {
    return t('detach PCI device');
  }

  static policy = 'os_compute_api:servers:create';

  static isActive = (item) => checkStatus(['active', 'shutoff'], item, false);

  static allowed = (item) =>
    Promise.resolve(DetachPCI.isActive(item) && isNotLockedOrAdmin(item));

  async fetchAttachedDevices() {
    try {
      const { id } = this.item;
      const result = await client.nova.servers.pciDevices.list(id);
      const devices = result.pci_devices || result || [];
      this.setState({
        attachedDevices: Array.isArray(devices) ? devices : [],
        loading: false,
      });
    } catch (e) {
      this.setState({ loading: false });
    }
  }

  getDeviceLabel(device) {
    const address = device.address || device.pci_address || '';
    const vendor = device.vendor_id || '';
    const product = device.product_id || '';
    const type = device.device_type || device.dev_type || '';
    return `${address} [${vendor}:${product}] ${type}`.trim();
  }

  get defaultValue() {
    return {
      instance: this.item.name,
    };
  }

  get formItems() {
    const { attachedDevices, loading } = this.state;

    const deviceOptions = attachedDevices.map((device, idx) => ({
      label: this.getDeviceLabel(device),
      value:
        device.address || device.pci_address || device.id || `device-${idx}`,
    }));

    return [
      {
        name: 'instance',
        label: t('Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'device_id',
        label: t('PCI Device'),
        type: 'select',
        options: deviceOptions,
        required: true,
        loading,
        placeholder: loading
          ? t('Loading attached devices...')
          : deviceOptions.length === 0
          ? t('No PCI devices attached')
          : t('Select device to detach'),
        disabled: deviceOptions.length === 0,
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { device_id } = values;
    const body = {
      detach_pci_device: { address: device_id },
    };
    // POST /servers/{id}/action
    return client.nova.servers.action(id, body);
  };
}

export default inject('rootStore')(observer(DetachPCI));
