// Copyright 2021 99cloud
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

import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';
import globalListenerStore from '../octavia/listener';

export class SecretsStore extends Base {
  get client() {
    return client.barbican.secrets;
  }

  get payloadClient() {
    return client.barbican.secrets.payload;
  }

  get fetchListByLimit() {
    return true;
  }

  get paramsFunc() {
    return (params) => ({
      ...params,
    });
  }

  updateMarkerParams = (limit, offset) => ({
    limit,
    offset,
  });

  get mapper() {
    return (data) => {
      const { secret_ref, algorithm } = data;
      const [, uuid] = secret_ref.split('/secrets/');
      let domain;
      let parsedExpiration;
      if (algorithm) {
        try {
          const parsed = JSON.parse(algorithm);
          domain = parsed.domain;
          parsedExpiration = parsed.expiration;
        } catch (e) {
          // algorithm is a plain string (e.g., "aes"), not JSON
        }
      }
      return {
        ...data,
        id: uuid,
        domain,
        expiration: parsedExpiration || data.expiration,
      };
    };
  }

  async requestListAllByLimit(params, limit) {
    let hasNext = true;
    let data = [];
    while (hasNext) {
      const offset = data.length || '';
      // eslint-disable-next-line no-await-in-loop
      const result = await this.requestListByMarker(params, limit, offset);
      const items = this.getListDataFromResult(result);
      data = [...data, ...items];
      if (limit >= result.total || offset >= result.total) {
        hasNext = false;
      }
    }
    return data;
  }

  updateItem(item, listeners) {
    const { secret_ref } = item;
    const enabledLs = listeners.filter((ls) => {
      const refs = [
        ls.default_tls_container_ref,
        ls.client_ca_tls_container_ref,
        ...ls.sni_container_refs,
      ];
      return refs.includes(secret_ref);
    });
    if (enabledLs.length) {
      item.listener = enabledLs.map((ls) => ({
        id: ls.id,
        name: ls.name,
        lb: ls.lbIds[0],
      }));
    }
    return item;
  }

  @action
  async fetchDetail({ id, silent }) {
    if (!silent) {
      this.isLoading = true;
    }
    const isAdmin = window.location.pathname.indexOf('-admin') !== -1;
    const fetches = [
      this.client.show(id, {}, { headers: { Accept: 'application/json' } }),
    ];
    if (!isAdmin) {
      fetches.push(
        this.payloadClient.list(id, {}, { headers: { Accept: 'text/plain' } })
      );
      fetches.push(globalListenerStore.fetchList());
    }
    const results = await Promise.allSettled(fetches);
    const item = results[0].status === 'fulfilled' ? results[0].value : { id };
    if (!isAdmin && results.length > 1) {
      item.payload = results[1].status === 'fulfilled' ? results[1].value : '';
      const listeners =
        results[2] && results[2].status === 'fulfilled' ? results[2].value : [];
      this.updateItem(item, listeners);
    }
    const detail = this.mapper(item || {});
    this.detail = detail;
    this.isLoading = false;
    return detail;
  }

  async listDidFetch(items) {
    if (items.length === 0) return items;
    let listeners = [];
    try {
      listeners = await globalListenerStore.fetchList();
    } catch (e) {
      // Octavia may be unavailable — skip listener matching
    }
    return items.map((it) => {
      this.updateItem(it, listeners);
      return {
        ...it,
      };
    });
  }

  @action
  async create(data) {
    const { expiration, domain, algorithm, ...rest } = data;
    const body = {
      ...rest,
      algorithm:
        algorithm ||
        JSON.stringify({
          domain,
          expiration,
        }),
    };
    return this.client.create(body);
  }
}

const globalSecretsStore = new SecretsStore();
export default globalSecretsStore;
