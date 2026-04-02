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

import React from 'react'; // eslint-disable-line no-unused-vars
import { observer, inject } from 'mobx-react';
import { Tag } from 'antd';
import Base from 'containers/List';
import { PCIDeviceStore } from 'stores/nova/pci';

// Device type display names — these are Nova PCI device type constants
const DEV_TYPE_LABELS = {
  'type-PCI': { text: 'Passthrough', color: 'blue' },
  'type-PF': { text: 'SR-IOV PF', color: 'green' },
  'type-VF': { text: 'SR-IOV VF', color: 'cyan' },
  vdpa: { text: 'vDPA', color: 'purple' },
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
      sorter: true,
    },
    {
      title: t('Vendor:Product'),
      dataIndex: 'vendor_product',
      isHideable: true,
      render: (_, record) => {
        const vid = record.vendor_id || '?';
        const pid = record.product_id || '?';
        return `${vid}:${pid}`;
      },
    },
    {
      title: t('Device Type'),
      dataIndex: 'device_type',
      isHideable: true,
      render: (value) => {
        const info = DEV_TYPE_LABELS[value];
        if (info) {
          return <Tag color={info.color}>{info.text}</Tag>;
        }
        return value || '-';
      },
    },
    {
      title: t('NUMA Node'),
      dataIndex: 'numa_node',
      isHideable: true,
      render: (value) =>
        value === null || value === undefined || value === -1
          ? t('Any')
          : String(value),
    },
    {
      title: t('Available'),
      dataIndex: 'count',
      sorter: true,
      isHideable: true,
    },
    {
      title: t('Tags'),
      dataIndex: 'tags',
      isHideable: true,
      render: (tags) => {
        if (!tags || typeof tags !== 'object') return '-';
        const entries = Object.entries(tags).filter(
          ([, v]) => v !== undefined && v !== null
        );
        if (entries.length === 0) return '-';
        return entries.map(([k, v]) => `${k}=${v}`).join(', ');
      },
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
      {
        label: t('Device Type'),
        name: 'device_type',
        options: [
          { key: 'type-PCI', label: t('Passthrough') },
          { key: 'type-PF', label: t('SR-IOV PF') },
          { key: 'type-VF', label: t('SR-IOV VF') },
          { key: 'vdpa', label: t('vDPA') },
        ],
      },
    ];
  }
}

export default inject('rootStore')(observer(PCIDevices));
