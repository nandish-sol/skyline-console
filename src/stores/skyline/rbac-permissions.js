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

/**
 * RBAC permission keys in the DB use the format: "{service}:{action}"
 * where {action} is the OpenStack policy string itself.
 * Example: "nova:os_compute_api:servers:delete"
 *
 * The permissions object from /rbac/my-permissions has these as keys.
 * The action classes have policy strings like "os_compute_api:servers:delete".
 *
 * To match: we look for any permission key that ends with the policy string.
 */

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
      const resp = await fetch('/api/v1/rbac/my-permissions', {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.ok) {
        const result = await resp.json();
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
    const permKeys = Object.keys(this.permissions);

    const blocked = policies.some((policyStr) => {
      // Find any permission key that ends with this policy string
      // e.g. policy "os_compute_api:servers:delete" matches key "nova:os_compute_api:servers:delete"
      const matchKey = permKeys.find(
        (k) => k.endsWith(`:${policyStr}`) || k === policyStr
      );
      return matchKey && this.permissions[matchKey] === false;
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
