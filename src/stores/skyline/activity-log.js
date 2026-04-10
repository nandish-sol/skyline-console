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

import { action, observable, runInAction } from 'mobx';
import Base from 'stores/base';
import client from 'client';

export class ActivityLogStore extends Base {
  @observable
  aggregations = {};

  @observable
  summaryTotal = 0;

  @observable
  filterOptions = {
    services: [],
    action_types: [],
    resource_types: [],
  };

  @observable
  dateRange = { start: undefined, end: undefined };

  get listResponseKey() {
    return 'activities';
  }

  get responseKey() {
    return 'activity';
  }

  get fetchListByLimit() {
    return true;
  }

  get paramsFuncPage() {
    return (params) => {
      const {
        current,
        page,
        all_projects,
        sortKey,
        sortOrder,
        silent,
        ...rest
      } = params;
      return rest;
    };
  }

  async requestListByPage(params, page) {
    const limit = params.limit || 20;
    const safePage = Number(page) || 1;
    const offset = (safePage - 1) * limit;

    const apiParams = { ...params };
    delete apiParams.current;
    delete apiParams.page;
    delete apiParams.sortKey;
    delete apiParams.sortOrder;
    delete apiParams.silent;
    delete apiParams.all_projects;
    apiParams.limit = limit;
    apiParams.offset = offset;

    const { start, end } = this.dateRange;
    if (start) apiParams.start = start;
    if (end) apiParams.end = end;

    const result = await client.skyline.request.get(
      'extension/activity-log',
      apiParams
    );

    runInAction(() => {
      this.aggregations = (result && result.aggregations) || {};
      this.summaryTotal = (result && result.total) || 0;
    });

    return result;
  }

  async getCountForPage(_newParams, _newData, _all_projects, result) {
    return { total: (result && result.total) || 0 };
  }

  @action
  async fetchFilterOptions() {
    try {
      const result = await client.skyline.request.get(
        'extension/activity-log/services'
      );
      runInAction(() => {
        this.filterOptions = {
          services: (result && result.services) || [],
          action_types: (result && result.action_types) || [],
          resource_types: (result && result.resource_types) || [],
        };
      });
    } catch (_e) {
      // Filter options are best-effort; empty lists are an acceptable fallback.
    }
  }

  @action
  setDateRange(start, end) {
    this.dateRange = { start, end };
  }
}

const globalActivityLogStore = new ActivityLogStore();
export default globalActivityLogStore;
