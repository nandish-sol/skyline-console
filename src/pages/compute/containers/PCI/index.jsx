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

import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import { PCIDeviceStore } from 'stores/nova/pci';

const PCI_VENDOR_MAP = {
  '10de': 'NVIDIA',
  8086: 'Intel',
  1002: 'AMD',
  '15b3': 'Mellanox',
  '14e4': 'Broadcom',
  '1af4': 'Red Hat (virtio)',
  '1b36': 'QEMU',
  '19e5': 'Huawei',
  '1d94': 'Xilinx',
  '1dd8': 'Pensando',
};

const PCI_DEV_TYPE_MAP = {
  'type-PCI': 'PCI Passthrough',
  'type-PF': 'SR-IOV PF',
  'type-VF': 'SR-IOV VF',
  vdpa: 'vDPA',
};

export class PCIDevices extends Base {
  init() {
    this.store = new PCIDeviceStore();
  }

  get name() {
    return t('PCI Device Pools');
  }

  get policy() {
    return 'os_compute_api:os-hypervisors:list';
  }

  get isFilterByBackend() {
    return false;
  }

  getColumns = () => [
    {
      title: t('Host'),
      dataIndex: 'host',
      isHideable: true,
    },
    {
      title: t('Vendor'),
      dataIndex: 'vendor_id',
      render: (value) => {
        const vid = String(value || '').toLowerCase();
        const name = PCI_VENDOR_MAP[vid];
        return name ? `${name} (${vid})` : vid || '-';
      },
      isHideable: true,
    },
    {
      title: t('Product ID'),
      dataIndex: 'product_id',
      isHideable: true,
    },
    {
      title: t('Device Type'),
      dataIndex: 'device_type',
      render: (value) => PCI_DEV_TYPE_MAP[value] || value || '-',
      isHideable: true,
    },
    {
      title: t('NUMA Node'),
      dataIndex: 'numa_node',
      render: (value) =>
        value === null || value === undefined || value === -1
          ? t('Any')
          : String(value),
      isHideable: true,
    },
    {
      title: t('Available'),
      dataIndex: 'count',
      isHideable: true,
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Host'),
        name: 'host',
      },
      {
        label: t('Vendor ID'),
        name: 'vendor_id',
      },
    ];
  }
}

export default inject('rootStore')(observer(PCIDevices));
