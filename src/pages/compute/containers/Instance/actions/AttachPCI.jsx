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

export class AttachPCI extends ModalAction {
  static id = 'attach-pci';

  static title = t('Attach PCI Device');

  static buttonText = t('Attach PCI Device');

  init() {
    this.state = {
      ...this.state,
      pciDevices: [],
      loading: true,
    };
    this.fetchPCIDevices();
  }

  get name() {
    return t('attach PCI device');
  }

  static policy = 'os_compute_api:servers:create';

  static isActive = (item) => checkStatus(['active', 'shutoff'], item, false);

  static allowed = (item) =>
    Promise.resolve(AttachPCI.isActive(item) && isNotLockedOrAdmin(item));

  async fetchPCIDevices() {
    try {
      // Get the compute host for this instance
      const host =
        this.item['OS-EXT-SRV-ATTR:host'] ||
        this.item['OS-EXT-SRV-ATTR:hypervisor_hostname'];

      if (!host) {
        this.setState({ loading: false });
        return;
      }

      // List hypervisors to find the right one
      const hypervisorsResult = await client.nova.hypervisors.list();
      const hypervisors =
        hypervisorsResult.hypervisors || hypervisorsResult || [];
      const hypervisor = hypervisors.find(
        (h) =>
          h.hypervisor_hostname === host ||
          (h.service && h.service.host === host)
      );

      if (hypervisor) {
        // Get PCI devices from hypervisor
        const pciResult = await client.nova.hypervisors.pci.list(hypervisor.id);
        const devices = pciResult.pci_devices || pciResult || [];
        this.setState({
          pciDevices: devices,
          loading: false,
        });
      } else {
        this.setState({ loading: false });
      }
    } catch (e) {
      this.setState({ loading: false });
    }
  }

  getDeviceLabel(device) {
    const type = device.device_type || device.dev_type || 'unknown';
    const vendor = device.vendor_id || 'N/A';
    const product = device.product_id || 'N/A';
    const address = device.address || device.pci_address || '';
    const count = device.count !== undefined ? ` (${device.count} avail)` : '';
    return `${address} [${vendor}:${product}] ${type}${count}`;
  }

  get defaultValue() {
    return {
      instance: this.item.name,
    };
  }

  get formItems() {
    const { pciDevices, loading } = this.state;

    const deviceOptions = pciDevices.map((device, idx) => ({
      label: this.getDeviceLabel(device),
      value: device.address || device.pci_address || `device-${idx}`,
    }));

    return [
      {
        name: 'instance',
        label: t('Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'pci_address',
        label: t('PCI Device'),
        type: 'select',
        options: deviceOptions,
        required: true,
        loading,
        placeholder: loading
          ? t('Loading available devices...')
          : deviceOptions.length === 0
          ? t('No PCI devices available')
          : t('Select a PCI device'),
        disabled: deviceOptions.length === 0,
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { pci_address } = values;
    const body = {
      pciDeviceAttachment: { address: pci_address },
    };
    // POST /servers/{id}/os-pci-devices
    return client.nova.servers.pciDevices.create(id, body);
  };
}

export default inject('rootStore')(observer(AttachPCI));
