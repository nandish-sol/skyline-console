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

import { observable, action } from 'mobx';

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

  @observable fetchError = false;

  _retryTimer = null;

  _permKeys = [];

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
        this._permKeys = Object.keys(this.permissions);
        this.hasCustomRole = result.has_custom_role || false;
        this.fetchError = false;
      } else {
        // Non-OK response: keep last known permissions, schedule retry
        this.fetchError = true;
        this._scheduleRetry();
      }
      this.isLoaded = true;
    } catch (e) {
      // On error: keep last known permissions, retry after 10s
      this.fetchError = true;
      this.isLoaded = true;
      this._scheduleRetry();
    }
  }

  _scheduleRetry() {
    this._clearRetry();
    this._retryTimer = setTimeout(() => {
      this._retryTimer = null;
      this.fetchPermissions();
    }, 10000);
  }

  _clearRetry() {
    if (this._retryTimer) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
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
    const permKeys = this._permKeys || Object.keys(this.permissions);

    const blocked = policies.some((policyStr) => {
      // Exact match: key ends with ":{policy}" or key === policy
      // RBAC keys are "{service}:{policy}" e.g. "nova:os_compute_api:servers:delete"
      // Skyline action policy is e.g. "os_compute_api:servers:delete"
      const matchKey = permKeys.find(
        (k) => k.endsWith(`:${policyStr}`) || k === policyStr
      );
      return matchKey && this.permissions[matchKey] === false;
    });

    return !blocked;
  }

  @action
  reset() {
    this._clearRetry();
    this.permissions = {};
    this.hasCustomRole = false;
    this.isLoaded = false;
    this.fetchError = false;
  }

  // Called by rootStore.clearData() on logout/project switch
  clearData() {
    this.reset();
  }
}

const globalRBACPermissionsStore = new RBACPermissionsStore();
export default globalRBACPermissionsStore;
