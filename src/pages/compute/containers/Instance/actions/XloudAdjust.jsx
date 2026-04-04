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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import { checkStatus, isNotLockedOrAdmin } from 'resources/nova/instance';
import {
  isHotaddEnabled,
  extractStatusFromResponse,
  mbToGb,
  gbToMb,
  FLAVOR_SPEC_MIN_CPU,
  FLAVOR_SPEC_MIN_MEMORY,
  STATUS_CURRENT_VCPUS,
  STATUS_CURRENT_MEMORY,
  STATUS_MAX_VCPUS,
  STATUS_MAX_MEMORY,
  STATUS_MIN_VCPUS,
  STATUS_MIN_MEMORY,
  STATUS_BALLOON_ACTIVE,
  STATUS_ATTACHED_DIMMS_MB,
  STATUS_HAS_VIRTIOMEM,
} from 'resources/nova/xloud';
import client from 'client';

export class XloudAdjust extends ModalAction {
  static id = 'xloud-adjust';

  static title = t('Resource Adjustment');

  static buttonText = t('Adjust Resources');

  init() {
    this.state = {
      ...this.state,
      xloudStatus: null,
      loading: true,
      fetchError: null,
      vcpuStep: 1,
    };
    this.fetchXloudStatus();
  }

  get name() {
    return t('adjust resources');
  }

  static policy = '';

  static isActive = (item) => checkStatus(['active'], item, false);

  static allowed = (item) => {
    const extraSpecs =
      (item.flavor_info && item.flavor_info.extra_specs) ||
      (item.flavor_info && item.flavor_info.extras) ||
      {};
    return Promise.resolve(
      XloudAdjust.isActive(item) &&
        isNotLockedOrAdmin(item) &&
        isHotaddEnabled(extraSpecs)
    );
  };

  async fetchXloudStatus() {
    try {
      const { id } = this.item;
      const result = await client.nova.servers.xloudStatus(id);
      const status = extractStatusFromResponse(result);

      // Extract CPU topology from flavor extra_specs for step calculation
      const extraSpecs =
        (this.item.flavor_info && this.item.flavor_info.extra_specs) ||
        (this.item.flavor_info && this.item.flavor_info.extras) ||
        {};
      const threads = parseInt(extraSpecs['hw:cpu_threads'] || '1', 10);
      const vcpuStep = threads > 1 ? threads : 1;

      this.setState(
        {
          xloudStatus: status,
          loading: false,
          vcpuStep,
        },
        () => {
          this.updateFormValue('current_vcpus', status[STATUS_CURRENT_VCPUS]);
          this.updateFormValue(
            'current_memory_gb',
            mbToGb(status[STATUS_CURRENT_MEMORY])
          );
        }
      );
    } catch (e) {
      // Fallback to flavor-based bounds
      const flavor = this.item.flavor_info || {};
      const extraSpecs = flavor.extra_specs || flavor.extras || {};
      const fallbackStatus = {
        [STATUS_CURRENT_VCPUS]: flavor.vcpus || 1,
        [STATUS_CURRENT_MEMORY]: flavor.ram || 1024,
        [STATUS_MAX_VCPUS]: flavor.vcpus || 1,
        [STATUS_MAX_MEMORY]: flavor.ram || 1024,
        [STATUS_MIN_VCPUS]: parseInt(
          extraSpecs[FLAVOR_SPEC_MIN_CPU] || '1',
          10
        ),
        [STATUS_MIN_MEMORY]: parseInt(
          extraSpecs[FLAVOR_SPEC_MIN_MEMORY] || '1024',
          10
        ),
        [STATUS_BALLOON_ACTIVE]: false,
        [STATUS_ATTACHED_DIMMS_MB]: 0,
        [STATUS_HAS_VIRTIOMEM]: false,
      };
      this.setState(
        {
          xloudStatus: fallbackStatus,
          loading: false,
          fetchError: t('Could not fetch live status, using flavor defaults.'),
        },
        () => {
          this.updateFormValue(
            'current_vcpus',
            fallbackStatus[STATUS_CURRENT_VCPUS]
          );
          this.updateFormValue(
            'current_memory_gb',
            mbToGb(fallbackStatus[STATUS_CURRENT_MEMORY])
          );
        }
      );
    }
  }

  get tips() {
    const { xloudStatus, fetchError } = this.state;
    if (!xloudStatus) return null;

    const hints = [];
    if (fetchError) {
      hints.push(
        <p key="error" style={{ color: '#faad14' }}>
          {fetchError}
        </p>
      );
    }

    const hasVirtiomem = xloudStatus[STATUS_HAS_VIRTIOMEM];
    const balloonActive = xloudStatus[STATUS_BALLOON_ACTIVE];
    const attachedDimms = xloudStatus[STATUS_ATTACHED_DIMMS_MB] || 0;

    if (hasVirtiomem) {
      hints.push(
        <p key="virtiomem" style={{ color: '#52c41a' }}>
          {t(
            'Memory is fully adjustable (increase and decrease) via virtio-mem.'
          )}
        </p>
      );
    } else if (!balloonActive) {
      hints.push(
        <p key="balloon" style={{ color: '#faad14' }}>
          {t(
            'Memory decrease is unavailable — guest balloon driver not detected.'
          )}
        </p>
      );
    }

    if (attachedDimms > 0) {
      hints.push(
        <p key="dimms" style={{ color: '#1890ff' }}>
          {t('{size} GB added via DIMM hotplug (cannot be removed).', {
            size: mbToGb(attachedDimms),
          })}
        </p>
      );
    }

    if (hints.length === 0) return null;
    return <div>{hints}</div>;
  }

  get defaultValue() {
    const { xloudStatus } = this.state;
    if (!xloudStatus) {
      return {
        instance: this.item.name,
        persist: true,
      };
    }
    return {
      instance: this.item.name,
      current_vcpus: xloudStatus[STATUS_CURRENT_VCPUS],
      current_memory_gb: mbToGb(xloudStatus[STATUS_CURRENT_MEMORY]),
      persist: true,
    };
  }

  get formItems() {
    const { xloudStatus, loading, vcpuStep } = this.state;

    if (loading || !xloudStatus) {
      return [
        {
          name: 'instance',
          label: t('Instance'),
          type: 'label',
          iconType: 'instance',
        },
        {
          name: 'loading',
          label: t('Status'),
          type: 'label',
          component: <span>{t('Loading resource status...')}</span>,
        },
      ];
    }

    const currentVcpus = xloudStatus[STATUS_CURRENT_VCPUS];
    const currentMemMb = xloudStatus[STATUS_CURRENT_MEMORY];
    const rawMaxVcpus = xloudStatus[STATUS_MAX_VCPUS];
    const rawMinVcpus = xloudStatus[STATUS_MIN_VCPUS];
    const rawMaxMemMb = xloudStatus[STATUS_MAX_MEMORY];
    const rawMinMemMb = xloudStatus[STATUS_MIN_MEMORY];
    // Guard against swapped min/max values
    const maxVcpus = Math.max(rawMaxVcpus, rawMinVcpus);
    const minVcpus = Math.min(rawMaxVcpus, rawMinVcpus);
    const maxMemGb = mbToGb(Math.max(rawMaxMemMb, rawMinMemMb));
    const minMemGb = mbToGb(Math.min(rawMaxMemMb, rawMinMemMb));

    return [
      {
        name: 'instance',
        label: t('Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'currentInfo',
        label: t('Current Resources'),
        type: 'label',
        component: (
          <span>
            {t('vCPUs')}: <strong>{currentVcpus}</strong>
            {' | '}
            {t('Memory')}: <strong>{mbToGb(currentMemMb)} GB</strong>
          </span>
        ),
      },
      {
        name: 'current_vcpus',
        label: t('New vCPU Count'),
        type: 'slider-input',
        min: minVcpus,
        max: maxVcpus,
        inputMin: minVcpus,
        inputMax: maxVcpus,
        description: `${t('Range')}: ${minVcpus} - ${maxVcpus}${
          vcpuStep > 1 ? `, ${t('step')}: ${vcpuStep}` : ''
        }`,
        required: false,
        tip:
          vcpuStep > 1
            ? t(
                'vCPU count will be aligned to multiples of {step} (threads per core).',
                { step: vcpuStep }
              )
            : undefined,
      },
      {
        name: 'current_memory_gb',
        label: t('New Memory (GB)'),
        type: 'slider-input',
        min: minMemGb,
        max: maxMemGb,
        inputMin: minMemGb,
        inputMax: maxMemGb,
        description: `${t('Range')}: ${minMemGb} GB - ${maxMemGb} GB`,
        required: false,
        step: 0.25,
      },
      {
        name: 'persist',
        label: t('Persist Changes'),
        type: 'check',
        content: t('Make configuration permanent after soft reboot'),
      },
    ];
  }

  onSubmit = async (values) => {
    const { id } = this.item;
    const { xloudStatus, vcpuStep } = this.state;

    const payload = {};

    // vCPU: align to step
    if (values.current_vcpus !== undefined && values.current_vcpus !== null) {
      let vcpus = parseInt(values.current_vcpus, 10);
      if (vcpuStep > 1) {
        vcpus = Math.round(vcpus / vcpuStep) * vcpuStep;
        const minVcpus = Math.min(
          xloudStatus[STATUS_MIN_VCPUS],
          xloudStatus[STATUS_MAX_VCPUS]
        );
        if (vcpus < minVcpus) vcpus = minVcpus;
      }
      payload.current_vcpus = vcpus;
    }

    // Memory: convert GB to MB
    if (
      values.current_memory_gb !== undefined &&
      values.current_memory_gb !== null
    ) {
      payload.current_memory_mb = gbToMb(parseFloat(values.current_memory_gb));
    }

    if (values.persist !== undefined) {
      payload.persist = !!values.persist;
    }

    // POST /os-xloud-adjust/{id} (top-level Nova endpoint)
    return client.nova.request.post(`os-xloud-adjust/${id}`, payload);
  };
}

export default inject('rootStore')(observer(XloudAdjust));
