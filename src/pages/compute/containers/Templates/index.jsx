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
import Base from 'containers/TabList';
import Templates from './Templates';

export class TabTemplates extends Base {
  get tabs() {
    const tabs = [
      {
        title: t('Current Project Templates'),
        key: 'project',
        component: Templates,
      },
      {
        title: t('Public Templates'),
        key: 'public',
        component: Templates,
      },
      {
        title: t('Shared Templates'),
        key: 'shared',
        component: Templates,
      },
    ];
    if (this.hasAdminRole) {
      tabs.push({
        title: t('All Templates'),
        key: 'all',
        component: Templates,
      });
    }
    return tabs;
  }
}

export default inject('rootStore')(observer(TabTemplates));
