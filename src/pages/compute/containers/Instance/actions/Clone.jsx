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
import globalNetworkStore from 'stores/neutron/network';
import globalAvailabilityZoneStore from 'stores/nova/zone';
import client from 'client';

export class Clone extends ModalAction {
  static id = 'clone-instance';

  static title = t('Clone Instance');

  static policy = '';

  static allowed = (item) =>
    Promise.resolve(
      ['active', 'stopped', 'shutoff', 'paused'].includes(
        (item.status || '').toLowerCase()
      )
    );

  init() {
    this.networkStore = globalNetworkStore;
    this.zoneStore = globalAvailabilityZoneStore;
    this.fetchData();
  }

  async fetchData() {
    await Promise.all([
      this.networkStore.fetchList(),
      this.zoneStore.fetchListWithoutDetail(),
    ]);
  }

  get name() {
    return t('Clone Instance');
  }

  get instanceName() {
    return this.values.name;
  }

  get defaultValue() {
    const { name } = this.item;
    return {
      instance: name,
      name: `${name}-clone`,
      auto_start: true,
    };
  }

  get networks() {
    return (this.networkStore.list.data || []).map((n) => ({
      value: n.id,
      label: n.name || n.id,
    }));
  }

  get availableZones() {
    return (this.zoneStore.list.data || [])
      .filter((z) => z.zoneState.available)
      .map((z) => ({
        value: z.zoneName,
        label: z.zoneName,
      }));
  }

  get formItems() {
    return [
      {
        name: 'instance',
        label: t('Source Instance'),
        type: 'label',
        iconType: 'instance',
      },
      {
        name: 'name',
        label: t('Clone Name'),
        type: 'input-name',
        required: true,
        isInstance: true,
      },
      {
        name: 'network_id',
        label: t('Network'),
        type: 'select',
        options: this.networks,
        tip: t(
          'Select a network for the clone. Leave empty to use the same network as the source.'
        ),
      },
      {
        name: 'availability_zone',
        label: t('Availability Zone'),
        type: 'select',
        options: this.availableZones,
        tip: t(
          'Select an availability zone. Leave empty to use the same zone as the source.'
        ),
      },
      {
        name: 'auto_start',
        label: t('Start After Cloning'),
        type: 'check',
      },
      {
        name: 'description',
        label: t('Description'),
        type: 'textarea',
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const body = {
      'xloud-clone': {
        name: values.name,
        auto_start: values.auto_start !== false,
      },
    };
    if (values.network_id) {
      body['xloud-clone'].network_id = values.network_id;
    }
    if (values.availability_zone) {
      body['xloud-clone'].availability_zone = values.availability_zone;
    }
    if (values.description) {
      body['xloud-clone'].description = values.description;
    }
    return client.nova.servers.action(id, body);
  };
}

export default inject('rootStore')(observer(Clone));
