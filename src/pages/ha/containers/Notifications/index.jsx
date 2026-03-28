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

import React from 'react';
import { observer, inject } from 'mobx-react';
import { Tag } from 'antd';
import Base from 'containers/List';
import globalNotificationStore, {
  NotificationStore,
} from 'stores/masakari/notifications';
import { Link } from 'react-router-dom';
import { masakariEndpoint } from 'client/client/constants';

const STATUS_MAP = {
  new: { color: 'blue', text: 'New' },
  running: { color: 'orange', text: 'Running' },
  finished: { color: 'green', text: 'Finished' },
  error: { color: 'red', text: 'Error' },
  failed: { color: 'red', text: 'Failed' },
  ignored: { color: 'default', text: 'Ignored' },
};

const TYPE_COLOR = {
  COMPUTE_HOST: 'red',
  VM: 'orange',
  PROCESS: 'blue',
  pacemaker: 'purple',
};

export class Notifications extends Base {
  init() {
    this.store = globalNotificationStore;
    this.downloadStore = new NotificationStore();
  }

  get policy() {
    if (this.isAdminPage) {
      return 'os_compute_api:servers:index:get_all_tenants';
    }
    return 'os_compute_api:servers:index';
  }

  get name() {
    return t('Notifications');
  }

  get defaultSortKey() {
    return 'updated_at';
  }

  get endpoint() {
    return masakariEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get searchFilters() {
    return [
      {
        label: t('Host'),
        name: 'source_host_uuid',
      },
      {
        label: t('UUID'),
        name: 'notification_uuid',
      },
      {
        label: t('Status'),
        name: 'status',
        options: [
          { label: t('New'), key: 'new' },
          { label: t('Running'), key: 'running' },
          { label: t('Finished'), key: 'finished' },
          { label: t('Error'), key: 'error' },
          { label: t('Failed'), key: 'failed' },
        ],
      },
      {
        label: t('Type'),
        name: 'type',
        options: [
          { label: t('Compute Host'), key: 'COMPUTE_HOST' },
          { label: t('VM'), key: 'VM' },
          { label: t('Process'), key: 'PROCESS' },
        ],
      },
    ];
  }

  getColumns = () => [
    {
      title: t('UUID'),
      dataIndex: 'notification_uuid',
      render: (value) => {
        const path = this.getRoutePath('masakariNotificationDetail', {
          id: value,
        });
        return <Link to={path}>{value}</Link>;
      },
    },
    {
      title: t('Source Host'),
      dataIndex: 'source_host_uuid',
      isHideable: true,
      copyable: true,
    },
    {
      title: t('Type'),
      dataIndex: 'type',
      isHideable: true,
      render: (val) => <Tag color={TYPE_COLOR[val] || 'default'}>{val}</Tag>,
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      isHideable: true,
      render: (val) => {
        const item = STATUS_MAP[val] || { color: 'default', text: val };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: t('Generated Time'),
      dataIndex: 'generated_time',
      isHideable: true,
      valueRender: 'toLocalTime',
    },
    {
      title: t('Updated At'),
      dataIndex: 'updated_at',
      isHideable: true,
      valueRender: 'toLocalTime',
    },
  ];
}

export default inject('rootStore')(observer(Notifications));
