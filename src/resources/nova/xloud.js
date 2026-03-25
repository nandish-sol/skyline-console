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

/**
 * XLoud Constants - Standardized naming conventions for XLoud features.
 *
 * Ported from openstack_dashboard/xloud_constants.py
 * These names are synchronized with the Nova API.
 */

// Flavor Extra Spec Keys (stored in Nova database)
export const FLAVOR_SPEC_MIN_CPU = 'minimum_cpu';
export const FLAVOR_SPEC_MIN_MEMORY = 'minimum_memory';
export const FLAVOR_SPEC_VIRTIO_MEM = 'hw:mem_hotplug_virtio';
export const FLAVOR_SPEC_MACHINE_TYPE = 'hw:machine_type';

// XLoud Status API Response Fields
// Match JSON keys from Nova /servers/{id}/xloud-status
export const STATUS_CURRENT_VCPUS = 'current_vcpus';
export const STATUS_CURRENT_MEMORY = 'current_memory_mb';
export const STATUS_MAX_VCPUS = 'max_vcpus';
export const STATUS_MAX_MEMORY = 'max_memory_mb';
export const STATUS_MIN_VCPUS = 'min_vcpus';
export const STATUS_MIN_MEMORY = 'min_memory_mb';

// Memory management status fields
export const STATUS_BALLOON_ACTIVE = 'balloon_driver_active';
export const STATUS_ATTACHED_DIMMS_MB = 'attached_dimms_mb';
export const STATUS_HAS_VIRTIOMEM = 'has_virtiomem';

// Response wrapper key
export const STATUS_RESPONSE_KEY = 'xloud_status';

// API endpoint path segments
export const API_XLOUD_STATUS_ENDPOINT = 'xloud-status';
export const API_XLOUD_ADJUST_ENDPOINT = 'xloud-adjust';

/**
 * Check if a flavor has hot-add capability enabled.
 * @param {Object} extraSpecs - flavor extra_specs object
 * @returns {boolean}
 */
export function isHotaddEnabled(extraSpecs) {
  if (!extraSpecs) return false;
  return (
    FLAVOR_SPEC_MIN_CPU in extraSpecs || FLAVOR_SPEC_MIN_MEMORY in extraSpecs
  );
}

/**
 * Extract xloud_status from API response.
 * The API can return either { xloud_status: {...} } or direct status dict.
 * @param {Object} responseData
 * @returns {Object}
 */
export function extractStatusFromResponse(responseData) {
  if (responseData && STATUS_RESPONSE_KEY in responseData) {
    return responseData[STATUS_RESPONSE_KEY];
  }
  return responseData;
}

/**
 * Convert memory MB to GB with 2 decimal places.
 * @param {number} mb
 * @returns {number}
 */
export function mbToGb(mb) {
  return Math.round((mb / 1024) * 100) / 100;
}

/**
 * Convert memory GB to MB.
 * @param {number} gb
 * @returns {number}
 */
export function gbToMb(gb) {
  return Math.round(gb * 1024);
}
