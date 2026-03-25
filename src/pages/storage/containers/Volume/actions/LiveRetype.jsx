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
import globalVolumeStore from 'stores/cinder/volume';
import globalVolumeTypeStore from 'stores/cinder/volume-type';

export class LiveRetype extends ModalAction {
  static id = 'live-retype';

  static title = t('Live Retype Volume');

  static buttonText = t('Live Retype');

  get name() {
    return t('live retype volume');
  }

  static policy = 'volume:retype';

  static allowed = (item) => {
    const validStatus = ['in-use', 'available'].includes(item.status);
    return Promise.resolve(validStatus);
  };

  get tips() {
    return t(
      'Live retype allows changing the volume type while the volume is attached. If the volume is large, this operation may take several hours.'
    );
  }

  init() {
    this.store = globalVolumeStore;
    this.volumeTypeStore = globalVolumeTypeStore;
    this.getVolumeTypes();
  }

  getVolumeTypes() {
    this.volumeTypeStore.fetchList();
  }

  get isAsyncAction() {
    return true;
  }

  get volumeTypes() {
    const { volume_type } = this.item;
    const { data = [] } = this.volumeTypeStore.list;
    return data
      .filter((it) => it.name !== volume_type)
      .map((item) => ({ label: item.name, value: item.name }));
  }

  get defaultValue() {
    const { name, id, volume_type, size } = this.item;
    return {
      volume: `${name || id} (${volume_type} | ${size} GiB)`,
      current_type: volume_type,
      migration_policy: 'on-demand',
    };
  }

  get formItems() {
    return [
      {
        name: 'volume',
        label: t('Volume'),
        type: 'label',
        iconType: 'volume',
      },
      {
        name: 'current_type',
        label: t('Current Type'),
        type: 'label',
      },
      {
        name: 'new_type',
        label: t('Destination Type'),
        type: 'select',
        required: true,
        options: this.volumeTypes,
        placeholder: this.volumeTypes.length
          ? t('Select a new volume type')
          : t('No other volume types available'),
      },
      {
        name: 'migration_policy',
        label: t('Migration Policy'),
        type: 'select',
        required: true,
        options: [
          {
            label: t('On Demand - Migrate data when needed'),
            value: 'on-demand',
          },
          {
            label: t('Never - Do not migrate data'),
            value: 'never',
          },
        ],
        tip: t(
          'On Demand will migrate data to the new backend if needed. Never will fail if migration is required.'
        ),
      },
    ];
  }

  onSubmit = (values) => {
    const { id } = this.item;
    const { new_type, migration_policy } = values;
    const body = {
      new_type,
      migration_policy,
    };
    return this.store.retype(id, body);
  };
}

export default inject('rootStore')(observer(LiveRetype));
