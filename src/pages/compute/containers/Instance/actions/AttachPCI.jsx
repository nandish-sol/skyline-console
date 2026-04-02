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
      pciPools: [],
      loading: true,
    };
    this.fetchPCIPools();
  }

  get name() {
    return t('attach PCI device');
  }

  static policy = 'os_compute_api:servers:create';

  static isActive = (item) => checkStatus(['active', 'shutoff'], item, false);

  static allowed = (item) =>
    Promise.resolve(AttachPCI.isActive(item) && isNotLockedOrAdmin(item));

  async fetchPCIPools() {
    try {
      const host =
        this.item['OS-EXT-SRV-ATTR:host'] ||
        this.item['OS-EXT-SRV-ATTR:hypervisor_hostname'];

      if (!host) {
        this.setState({ loading: false });
        return;
      }

      // List hypervisors to find PCI pools on the instance's host
      const result = await client.nova.hypervisors.listDetail();
      const hypervisors = result.hypervisors || result || [];
      const hypervisor = hypervisors.find(
        (h) =>
          h.hypervisor_hostname === host ||
          (h.service && h.service.host === host)
      );

      const pools = [];
      if (hypervisor) {
        const pciStats =
          hypervisor.pci_stats || hypervisor.pci_device_pools || [];
        if (Array.isArray(pciStats)) {
          pciStats.forEach((pool) => {
            if (pool.count > 0) {
              pools.push({
                vendor_id: pool.vendor_id || '',
                product_id: pool.product_id || '',
                count: pool.count || 0,
                device_type: pool.dev_type || pool.device_type || '',
                numa_node: pool.numa_node,
                address: pool.address || '',
              });
            }
          });
        }
      }

      this.setState({ pciPools: pools, loading: false });
    } catch (e) {
      this.setState({ loading: false });
    }
  }

  get defaultValue() {
    return {
      instance: this.item.name,
    };
  }

  get formItems() {
    const { pciPools, loading } = this.state;

    const deviceOptions = pciPools.map((pool, idx) => {
      const vid = pool.vendor_id || '?';
      const pid = pool.product_id || '?';
      const dtype = pool.device_type || '';
      const count = pool.count || 0;
      const addr = pool.address || '';
      const label = addr
        ? `${addr} [${vid}:${pid}] ${dtype} (${count} avail)`
        : `[${vid}:${pid}] ${dtype} (${count} avail)`;
      return {
        label,
        value: addr || `${vid}:${pid}:${idx}`,
      };
    });

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
        type: deviceOptions.length > 0 ? 'select' : 'input',
        options: deviceOptions.length > 0 ? deviceOptions : undefined,
        required: true,
        loading,
        placeholder: loading
          ? t('Loading available devices...')
          : deviceOptions.length === 0
          ? t(
              'No PCI pools found. Enter device address manually (e.g. 0000:8b:00.0)'
            )
          : t('Select a PCI device'),
        tip:
          deviceOptions.length === 0
            ? t(
                'PCI address format: DDDD:BB:SS.F (e.g. 0000:8b:00.0). Ensure the device is bound to vfio-pci on the host.'
              )
            : undefined,
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { pci_address: addr } = values;
    // Extract actual address if it was from a pool selection with format "vid:pid:idx"
    const pciAddress = addr.includes('.')
      ? addr
      : addr.split(':').slice(0, -1).join(':');
    const body = {
      pciDeviceAttachment: { address: pciAddress },
    };
    return client.nova.servers.pciDevices.create(id, body);
  };
}

export default inject('rootStore')(observer(AttachPCI));
