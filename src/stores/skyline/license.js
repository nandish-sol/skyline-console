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

import { action, computed, observable } from 'mobx';
import client from 'client';
import { setLocalStorageItem } from 'utils/local-storage';

// Actions always allowed even when license is expired
const ALWAYS_ALLOWED_ACTIONS = new Set([
  // Power control
  'start',
  'stop',
  'shutdown',
  'reboot',
  'softReboot',
  'soft-reboot',
  'hard-reboot',
  'pause',
  'unpause',
  'suspend',
  'resume',
  // Console access
  'console',
  'getConsole',
  'vnc-console',
  // Lock/unlock
  'lock',
  'unlock',
  // Shelve
  'shelve',
  'unshelve',
  // View/read operations (these are typically not mutating actions)
  'view',
  'detail',
  'show',
]);

// Poll interval: 5 minutes
const POLL_INTERVAL = 5 * 60 * 1000;

// Banner dismiss durations (milliseconds)
const DISMISS_DURATION_ACTIVE = 30 * 60 * 1000; // 30 min
const DISMISS_DURATION_WARNING = 60 * 1000; // 1 min

// Reshow banner after N page views
const RESHOW_AFTER_PAGE_VIEWS = 5;

export class LicenseStore {
  @observable
  licenseData = {};

  @observable
  isLoaded = false;

  @observable
  isLoading = false;

  @observable
  bannerDismissed = false;

  _pollTimer = null;

  _pageViewCount = 0;

  @computed
  get restrictedMode() {
    return !!(
      this.licenseData.restricted_mode ||
      this.licenseData.expired ||
      (this.licenseData.days_remaining !== undefined &&
        this.licenseData.days_remaining <= 0)
    );
  }

  @computed
  get status() {
    return this.licenseData.status || 'unknown';
  }

  @computed
  get daysRemaining() {
    return this.licenseData.days_remaining || 0;
  }

  @computed
  get isExpired() {
    return !!this.licenseData.expired;
  }

  @computed
  get isWarning() {
    return this.daysRemaining > 0 && this.daysRemaining <= 7;
  }

  @computed
  get serial() {
    return this.licenseData.serial || '';
  }

  @computed
  get startDate() {
    return this.licenseData.start_date || '';
  }

  @computed
  get endDate() {
    return this.licenseData.end_date || '';
  }

  @computed
  get maxSockets() {
    return this.licenseData.max_sockets || 0;
  }

  @computed
  get clusterId() {
    return this.licenseData.cluster_id || '';
  }

  @computed
  get vendor() {
    return this.licenseData.vendor || '';
  }

  @computed
  get licenseType() {
    return this.licenseData.license_type || '';
  }

  @computed
  get message() {
    return this.licenseData.message || '';
  }

  @computed
  get bannerColor() {
    const { status } = this;
    if (status === 'active' && this.daysRemaining > 7) return 'success';
    if (status === 'grace_period' || status === 'invalid_node') return 'info';
    if (this.isWarning || status === 'warning') return 'warning';
    if (status === 'expired') return 'expired';
    if (status === 'tamper_detected' || status === 'critical')
      return 'critical';
    return 'info';
  }

  @computed
  get shouldShowBanner() {
    if (!this.isLoaded) return false;
    // Always show for expired / critical
    if (this.isExpired || this.status === 'critical') return true;
    if (!this.bannerDismissed) return true;
    return false;
  }

  @action
  async fetchLicenseStatus() {
    this.isLoading = true;
    try {
      const result = await client.skyline.license.status();
      this.licenseData = result || {};
      this.isLoaded = true;
    } catch (e) {
      // If endpoint not available, treat as unrestricted
      console.warn('License status fetch failed:', e);
      this.licenseData = {};
      this.isLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  @action
  dismissBanner() {
    this.bannerDismissed = true;
    this._pageViewCount = 0;
    setLocalStorageItem('xloud_banner_dismissed_at', Date.now().toString());

    // Auto-reshow after timeout
    const duration =
      this.status === 'active'
        ? DISMISS_DURATION_ACTIVE
        : DISMISS_DURATION_WARNING;
    setTimeout(() => {
      this.bannerDismissed = false;
    }, duration);
  }

  @action
  onPageView() {
    if (!this.bannerDismissed) return;
    this._pageViewCount += 1;
    if (this._pageViewCount >= RESHOW_AFTER_PAGE_VIEWS) {
      this.bannerDismissed = false;
      this._pageViewCount = 0;
    }
  }

  @action
  startPolling() {
    this.stopPolling();
    this._pollTimer = setInterval(() => {
      this.fetchLicenseStatus();
    }, POLL_INTERVAL);
  }

  @action
  stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  @action
  clearData() {
    this.stopPolling();
    this.licenseData = {};
    this.isLoaded = false;
    this.isLoading = false;
    this.bannerDismissed = false;
    this._pageViewCount = 0;
  }

  /**
   * Check if a specific action is allowed under the current license state.
   * Returns true if the action should be visible/enabled.
   */
  isActionAllowed(actionName) {
    if (!this.restrictedMode) return true;
    if (!actionName) return false;

    // Normalize: lowercase, strip common prefixes
    const name = String(actionName)
      .toLowerCase()
      .replace(/^(os-|os_)/, '');

    // Check against always-allowed set
    const allowedArr = Array.from(ALWAYS_ALLOWED_ACTIONS);
    return allowedArr.some((a) => {
      const lower = a.toLowerCase();
      return name === lower || name.includes(lower);
    });
  }
}

const globalLicenseStore = new LicenseStore();
export default globalLicenseStore;
