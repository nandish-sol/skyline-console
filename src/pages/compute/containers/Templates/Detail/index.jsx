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
import { ImageStore } from 'stores/glance/image';
import Base from 'containers/TabDetail';
import BaseDetail from './BaseDetail';
import allActionConfigs from '../actions';

export class TemplateDetail extends Base {
  get name() {
    return t('VM Template');
  }

  get policy() {
    return 'get_image';
  }

  get listUrl() {
    return this.getRoutePath('computeTemplate');
  }

  get actionConfigs() {
    return this.isAdminPage
      ? allActionConfigs.adminActionConfigs
      : allActionConfigs.actionConfigs;
  }

  get detailInfos() {
    return [
      {
        title: t('Template Name'),
        dataIndex: 'xloud_template_name',
        render: (value, record) => value || record.name || '-',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
      },
      {
        title: t('Version'),
        dataIndex: 'xloud_template_version',
        render: (value) => value || '1.0',
      },
      {
        title: t('Category'),
        dataIndex: 'xloud_template_category',
        render: (value) => value || '-',
      },
      {
        title: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
      },
      {
        title: t('Updated At'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
    ];
  }

  get tabs() {
    return [
      {
        title: t('Detail'),
        key: 'detail',
        component: BaseDetail,
      },
    ];
  }

  init() {
    this.store = new ImageStore();
  }
}

export default inject('rootStore')(observer(TemplateDetail));
