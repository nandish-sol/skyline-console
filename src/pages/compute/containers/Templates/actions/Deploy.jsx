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

import { inject, observer } from 'mobx-react';
import { ModalAction } from 'containers/Action';
import globalServerStore from 'stores/nova/instance';

export class Deploy extends ModalAction {
  static id = 'deploy-template';

  static title = t('Deploy');

  static buttonText = t('Deploy');

  static policy = 'os_compute_api:servers:create';

  static allowed = (item) =>
    Promise.resolve(
      item.status === 'active' && !!item.xloud_template_flavor_id
    );

  init() {
    this.store = globalServerStore;
  }

  get labelCol() {
    return {
      xs: { span: 8 },
      sm: { span: 7 },
    };
  }

  get name() {
    return t('Deploy from Template');
  }

  get messageHasItemName() {
    return false;
  }

  get instanceName() {
    return this.values.name;
  }

  get tips() {
    return t(
      'Creates a new instance using the captured template configuration. ' +
        'The flavor, network, security groups, key pair, and availability zone ' +
        'from the source instance will be used automatically.'
    );
  }

  get capturedFlavorText() {
    const { item } = this;
    const name = item.xloud_template_flavor_name || item.flavorName || '-';
    const v = item.xloud_template_vcpus || item.vcpus || '-';
    const r = item.xloud_template_ram_mb || item.ramMb || '-';
    const rawDisk =
      item.xloud_template_disk_gb != null
        ? item.xloud_template_disk_gb
        : item.diskGb;
    const diskNum = rawDisk == null || rawDisk === '' ? null : Number(rawDisk);
    const disk =
      diskNum === 0
        ? t('Volume-backed')
        : diskNum == null || Number.isNaN(diskNum)
        ? '-'
        : `${diskNum} GB`;
    return `${name}  (${v} vCPU / ${r} MB / ${disk})`;
  }

  get capturedSecurityGroups() {
    const { item } = this;
    if (Array.isArray(item.securityGroups) && item.securityGroups.length) {
      return item.securityGroups;
    }
    try {
      const arr = JSON.parse(item.xloud_template_security_groups || '[]');
      if (Array.isArray(arr)) {
        return arr;
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  get defaultValue() {
    const { item } = this;
    return {
      template: item.templateName || item.xloud_template_name || item.name,
      captured_flavor: this.capturedFlavorText,
      captured_network:
        item.xloud_template_network_name || item.networkName || '-',
      captured_security_groups: this.capturedSecurityGroups.join(', ') || '-',
      captured_keypair: item.xloud_template_keypair || item.keypair || '-',
      captured_az: item.xloud_template_az || item.az || '-',
      count: 1,
    };
  }

  get formItems() {
    return [
      {
        name: 'template',
        label: t('Template'),
        type: 'label',
        iconType: 'image',
      },
      {
        name: 'captured_flavor',
        label: t('Flavor'),
        type: 'label',
        iconType: 'flavor',
      },
      {
        name: 'captured_network',
        label: t('Network'),
        type: 'label',
        iconType: 'network',
      },
      {
        name: 'captured_security_groups',
        label: t('Security Groups'),
        type: 'label',
        iconType: 'security',
      },
      {
        name: 'captured_keypair',
        label: t('Key Pair'),
        type: 'label',
        iconType: 'keypair',
      },
      {
        name: 'captured_az',
        label: t('Availability Zone'),
        type: 'label',
      },
      {
        name: 'name',
        label: t('Instance Name'),
        type: 'input-name',
        required: true,
        isInstance: true,
      },
      {
        name: 'count',
        label: t('Count'),
        type: 'input-number',
        min: 1,
        max: 10,
        required: true,
      },
    ];
  }

  onSubmit = (values) => {
    const { name, count = 1 } = values;
    const { item } = this;
    const flavorId = item.xloud_template_flavor_id || item.flavorId;
    const networkId = item.xloud_template_network_id || item.networkId;
    const keypair = item.xloud_template_keypair || item.keypair;
    const az = item.xloud_template_az || item.az;
    const sgs = this.capturedSecurityGroups;

    const server = {
      name,
      imageRef: item.id,
      flavorRef: flavorId,
    };
    if (networkId) {
      server.networks = [{ uuid: networkId }];
    }
    if (sgs.length) {
      server.security_groups = sgs.map((n) => ({ name: n }));
    }
    if (keypair) {
      server.key_name = keypair;
    }
    if (az) {
      server.availability_zone = az;
    }
    if (count > 1) {
      server.min_count = count;
      server.max_count = count;
      server.return_reservation_id = true;
    }
    return this.store.create({ server });
  };
}

export default inject('rootStore')(observer(Deploy));
