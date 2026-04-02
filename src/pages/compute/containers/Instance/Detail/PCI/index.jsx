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
import { InstancePCIStore } from 'stores/nova/instance-pci';

export class PCIDeviceList extends Base {
  init() {
    this.store = new InstancePCIStore();
  }

  get name() {
    return t('PCI Devices');
  }

  get policy() {
    return 'os_compute_api:servers:show';
  }

  get isFilterByBackend() {
    return false;
  }

  updateFetchParams = () => {
    const { id } = this.props.detail || this.props.match.params || {};
    return { serverId: id };
  };

  getColumns = () => [
    {
      title: t('Device ID'),
      dataIndex: 'id',
      isHideable: true,
    },
    {
      title: t('Address'),
      dataIndex: 'address',
      isHideable: true,
    },
    {
      title: t('Vendor:Product'),
      dataIndex: 'vendor_product',
      render: (_, record) => {
        const vid = record.vendor_id || '';
        const pid = record.product_id || '';
        return vid || pid ? `${vid}:${pid}` : '-';
      },
      isHideable: true,
    },
    {
      title: t('Device Type'),
      dataIndex: 'device_type',
      render: (value) => {
        if (!value) return '-';
        const colorMap = {
          'type-PCI': 'blue',
          'type-PF': 'green',
          'type-VF': 'cyan',
          vdpa: 'purple',
        };
        return <Tag color={colorMap[value] || 'default'}>{value}</Tag>;
      },
      isHideable: true,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (value) => value || '-',
      isHideable: true,
    },
  ];

  get searchFilters() {
    return [];
  }
}

export default inject('rootStore')(observer(PCIDeviceList));
