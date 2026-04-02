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

import client from 'client';
import Base from 'stores/base';

/**
 * PCI Device Pool Store - Fetches PCI device pools from hypervisors.
 *
 * Nova doesn't have a dedicated PCI pool API. Device pools are obtained
 * from the hypervisor detail's pci_stats field.
 */
export class PCIDeviceStore extends Base {
  get client() {
    return client.nova.hypervisors;
  }

  get listResponseKey() {
    return 'hypervisors';
  }

  async listDidFetch(items) {
    // Extract PCI device pools from each hypervisor
    const pciDevices = [];
    items.forEach((hypervisor) => {
      const host = hypervisor.hypervisor_hostname || hypervisor.host || '';
      const pools = hypervisor.pci_stats || hypervisor.pci_device_pools || [];
      if (Array.isArray(pools)) {
        pools.forEach((pool, idx) => {
          pciDevices.push({
            id: `${host}-${idx}`,
            host,
            vendor_id: pool.vendor_id || '',
            product_id: pool.product_id || '',
            count: pool.count || 0,
            device_type: pool.dev_type || pool.device_type || '',
            numa_node: pool.numa_node,
            tags: pool.tags || {},
          });
        });
      }
    });
    return pciDevices;
  }
}

const globalPCIDeviceStore = new PCIDeviceStore();
export default globalPCIDeviceStore;
