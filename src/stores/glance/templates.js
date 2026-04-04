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

import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class TemplateStore extends Base {
  get client() {
    return client.glance.images;
  }

  get fetchListByLimit() {
    return true;
  }

  get paramsFunc() {
    return (params) => {
      const { current, all_projects, ...rest } = params;
      return {
        ...rest,
        xloud_template: 'true',
      };
    };
  }

  get mapper() {
    return (data) => {
      const props = data || {};
      return {
        ...data,
        templateName: props.xloud_template_name || props.name || '',
        templateVersion: props.xloud_template_version || '1.0',
        templateCategory: props.xloud_template_category || 'custom',
        templateDescription: props.xloud_template_description || '',
        flavorName: props.xloud_template_flavor_name || '-',
        flavorId: props.xloud_template_flavor_id || '',
        vcpus: props.xloud_template_vcpus || '-',
        ramMb: props.xloud_template_ram_mb || '-',
        diskGb: props.xloud_template_disk_gb || '-',
        networkName: props.xloud_template_network_name || '-',
        networkId: props.xloud_template_network_id || '',
        securityGroups: (() => {
          try {
            return JSON.parse(props.xloud_template_security_groups || '[]');
          } catch {
            return [];
          }
        })(),
        keypair: props.xloud_template_keypair || '',
        az: props.xloud_template_az || '',
        sourceInstance: props.xloud_template_source_instance || '',
        createdBy: props.xloud_template_created_by || '',
        templateCreatedAt: props.xloud_template_created_at || '',
      };
    };
  }

  @action
  async deleteTemplate(id) {
    return this.client.delete(id);
  }

  @action
  async updateTemplate(id, updates) {
    // PATCH Glance image properties
    const patchBody = Object.entries(updates).map(([key, value]) => ({
      op: 'replace',
      path: `/${key}`,
      value,
    }));
    return this.client.patch(id, patchBody);
  }
}

const globalTemplateStore = new TemplateStore();
export default globalTemplateStore;
