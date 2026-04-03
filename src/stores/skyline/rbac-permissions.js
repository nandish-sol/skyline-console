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

import { observable, action, computed } from 'mobx';
import client from 'client';

/**
 * Maps Skyline OpenStack policy strings to RBAC permission keys.
 * Key: OpenStack policy (used by action classes)
 * Value: RBAC permission key (stored in DB)
 */
const POLICY_TO_RBAC = {
  // Nova - Instance Lifecycle
  'os_compute_api:servers:index': 'nova:server_list',
  'os_compute_api:servers:show': 'nova:server_show',
  'os_compute_api:servers:create': 'nova:server_create',
  'os_compute_api:servers:delete': 'nova:server_delete',
  'os_compute_api:servers:update': 'nova:server_update',
  'os_compute_api:os-remote-consoles': 'nova:server_console',

  // Nova - Instance Actions
  'os_compute_api:servers:start': 'nova:server_start',
  'os_compute_api:servers:stop': 'nova:server_stop',
  'os_compute_api:servers:reboot': 'nova:server_reboot',
  'os_compute_api:os-pause-server:pause': 'nova:server_pause',
  'os_compute_api:os-pause-server:unpause': 'nova:server_unpause',
  'os_compute_api:os-suspend-server:suspend': 'nova:server_suspend',
  'os_compute_api:os-suspend-server:resume': 'nova:server_resume',
  'os_compute_api:os-lock-server:lock': 'nova:server_lock',
  'os_compute_api:os-lock-server:unlock': 'nova:server_unlock',
  'os_compute_api:os-shelve:shelve': 'nova:server_shelve',
  'os_compute_api:os-shelve:unshelve': 'nova:server_unshelve',

  // Nova - Resize
  'os_compute_api:servers:resize': 'nova:server_resize',
  'os_compute_api:servers:confirm_resize': 'nova:server_resize',
  'os_compute_api:servers:revert_resize': 'nova:server_resize',
  'os_compute_api:os-migrate-server:migrate': 'nova:server_migrate',
  'os_compute_api:os-migrate-server:migrate_live': 'nova:server_migrate',

  // Nova - Attach/Detach
  'os_compute_api:os-volumes-attachments:create': 'nova:server_attach_volume',
  'os_compute_api:os-volumes-attachments:delete': 'nova:server_detach_volume',
  'os_compute_api:os-attach-interfaces:create': 'nova:server_attach_interface',
  'os_compute_api:os-attach-interfaces:delete': 'nova:server_detach_interface',

  // Nova - Snapshots/Images
  'os_compute_api:servers:create_image': 'nova:server_snapshot',
  'os_compute_api:servers:rebuild': 'nova:server_rebuild',

  // Nova - Placement
  'os_compute_api:servers:show:host_status': 'nova:server_placement',

  // Cinder - Volumes
  'volume:get_all': 'cinder:volume_list',
  'volume:get': 'cinder:volume_show',
  'volume:create': 'cinder:volume_create',
  'volume:delete': 'cinder:volume_delete',
  'volume:update': 'cinder:volume_update',
  'volume:extend': 'cinder:volume_extend',

  // Cinder - Snapshots
  'volume_extension:volume_actions:snapshot': 'cinder:snapshot_create',
  'volume:create_snapshot': 'cinder:snapshot_create',

  // Cinder - Backups
  'backup:create': 'cinder:backup_create',
  'backup:delete': 'cinder:backup_delete',
  'backup:restore': 'cinder:backup_restore',

  // Neutron - Networks
  create_network: 'neutron:network_create',
  delete_network: 'neutron:network_delete',
  update_network: 'neutron:network_update',
  get_network: 'neutron:network_list',

  // Neutron - Routers
  create_router: 'neutron:router_create',
  delete_router: 'neutron:router_delete',
  update_router: 'neutron:router_update',

  // Neutron - Floating IPs
  create_floatingip: 'neutron:floatingip_create',
  delete_floatingip: 'neutron:floatingip_delete',
  update_floatingip: 'neutron:floatingip_update',

  // Neutron - Ports
  create_port: 'neutron:port_create',
  delete_port: 'neutron:port_delete',
  update_port: 'neutron:port_update',

  // Neutron - Security Groups
  create_security_group: 'neutron:security_group_create',
  delete_security_group: 'neutron:security_group_delete',
  update_security_group: 'neutron:security_group_update',

  // Glance - Images
  add_image: 'glance:image_create',
  delete_image: 'glance:image_delete',
  modify_image: 'glance:image_update',
};

class RBACPermissionsStore {
  @observable permissions = {};

  @observable hasCustomRole = false;

  @observable isLoaded = false;

  @computed get hasRBACRestrictions() {
    return this.hasCustomRole && this.isLoaded;
  }

  @action
  async fetchPermissions() {
    try {
      const result = await client.skyline.request.get('rbac/my-permissions');
      if (result) {
        this.permissions = result.permissions || {};
        this.hasCustomRole = result.has_custom_role || false;
      }
      this.isLoaded = true;
    } catch (e) {
      // Non-fatal — if RBAC service is unavailable, allow everything
      this.permissions = {};
      this.hasCustomRole = false;
      this.isLoaded = true;
    }
  }

  /**
   * Check if an action is allowed based on RBAC permissions.
   * @param {string|string[]} policy - OpenStack policy string(s) from action class
   * @returns {boolean} true if allowed, false if blocked
   */
  isAllowed(policy) {
    // No custom role = no restrictions (default OpenStack policy applies)
    if (!this.hasCustomRole || !this.isLoaded) {
      return true;
    }

    const policies = Array.isArray(policy) ? policy : [policy];

    const blocked = policies.some((p) => {
      const rbacKey = POLICY_TO_RBAC[p];
      return rbacKey && this.permissions[rbacKey] === false;
    });

    return !blocked;
  }

  @action
  reset() {
    this.permissions = {};
    this.hasCustomRole = false;
    this.isLoaded = false;
  }
}

const globalRBACPermissionsStore = new RBACPermissionsStore();
export default globalRBACPermissionsStore;
