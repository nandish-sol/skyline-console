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

import { action, observable } from 'mobx';
import client from 'client';
import List from 'stores/base-list';

export class ActivityLogStore {
  @observable
  list = new List();

  @observable
  isLoading = false;

  @action
  async fetchList({
    action: actionFilter,
    project_id,
    user_id,
    start,
    end,
    limit = 100,
    marker,
  } = {}) {
    this.isLoading = true;
    this.list.isLoading = true;

    const params = {};
    if (actionFilter) params.action = actionFilter;
    if (project_id) params.project_id = project_id;
    if (user_id) params.user_id = user_id;
    if (start) params.start = start;
    if (end) params.end = end;
    if (limit) params.limit = limit;
    if (marker) params.marker = marker;

    try {
      const result = await client.skyline.request.get(
        'extension/activity-log',
        params
      );
      const activities = (result && result.activities) || [];
      this.list.data = activities;
      this.list.total = activities.length;
      this.list.isLoading = false;
      this.isLoading = false;
      return activities;
    } catch (e) {
      this.list.isLoading = false;
      this.isLoading = false;
      throw e;
    }
  }
}

const globalActivityLogStore = new ActivityLogStore();
export default globalActivityLogStore;
