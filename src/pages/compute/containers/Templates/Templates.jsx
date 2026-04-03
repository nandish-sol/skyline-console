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
import { imageStatus } from 'resources/glance/image';
import { TemplateStore } from 'stores/glance/templates';
import { getOptions } from 'utils/index';
import actionConfigs from './actions';

export class Templates extends Base {
  init() {
    this.store = new TemplateStore();
  }

  get policy() {
    return 'get_images';
  }

  get name() {
    return t('VM Templates');
  }

  get checkEndpoint() {
    return false;
  }

  get actionConfigs() {
    return this.isAdminPage
      ? actionConfigs.adminActionConfigs
      : actionConfigs.actionConfigs;
  }

  get isFilterByBackend() {
    return false;
  }

  get isSortByBackend() {
    return true;
  }

  get defaultSortKey() {
    return 'created_at';
  }

  get adminPageHasProjectFilter() {
    return true;
  }

  get projectFilterKey() {
    return 'owner';
  }

  updateFetchParams = (params) => {
    if (this.isAdminPage) {
      return params;
    }
    return {
      ...params,
      owner: this.currentProjectId,
    };
  };

  getColumns() {
    return [
      {
        title: t('ID/Name'),
        dataIndex: 'templateName',
        routeName: this.getRouteName('computeTemplateDetail'),
      },
      {
        title: t('Project ID/Name'),
        dataIndex: 'project_name',
        hidden: !this.isAdminPage,
        sorter: false,
      },
      {
        title: t('Description'),
        dataIndex: 'templateDescription',
        isHideable: true,
        sorter: false,
      },
      {
        title: t('Version'),
        dataIndex: 'templateVersion',
        isHideable: true,
        width: 80,
        sorter: false,
      },
      {
        title: t('Category'),
        dataIndex: 'templateCategory',
        isHideable: true,
        width: 120,
        sorter: false,
        render: (value) => {
          const map = {
            'base-os': t('Base OS'),
            'web-server': t('Web Server'),
            database: t('Database'),
            application: t('Application'),
            custom: t('Custom'),
          };
          return map[value] || value || '-';
        },
      },
      {
        title: t('Flavor'),
        dataIndex: 'flavorName',
        isHideable: true,
        width: 120,
        sorter: false,
      },
      {
        title: t('Configuration'),
        dataIndex: 'vcpus',
        isHideable: true,
        width: 140,
        sorter: false,
        render: (_, record) => {
          const vcpus = record.vcpus || '-';
          const ram = record.ramMb || '-';
          return `${vcpus} vCPU / ${ram} MB`;
        },
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        valueMap: imageStatus,
      },
      {
        title: t('Size'),
        dataIndex: 'size',
        isHideable: true,
        valueRender: 'formatSize',
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        isHideable: true,
        valueRender: 'sinceTime',
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
      {
        label: t('Status'),
        name: 'status',
        options: getOptions(imageStatus),
      },
    ];
  }
}

export default inject('rootStore')(observer(Templates));
