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

import client from 'client';
import Base from 'stores/base';

/**
 * Instance PCI Device Store - fetches PCI devices attached to an instance.
 * Uses GET /servers/{id}/os-pci-devices
 */
export class InstancePCIStore extends Base {
  get client() {
    return client.nova.servers.pciDevices;
  }

  get isSubResource() {
    return true;
  }

  getFatherResourceId = (params) => params.serverId;

  get listResponseKey() {
    return 'pciDeviceAttachments';
  }

  get paramsFunc() {
    return (params) => {
      const { serverId, ...rest } = params;
      return rest;
    };
  }
}

const globalInstancePCIStore = new InstancePCIStore();
export default globalInstancePCIStore;
