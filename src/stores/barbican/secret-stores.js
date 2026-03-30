import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';

export class SecretStoresStore extends Base {
  get client() {
    return client.barbican.secretStores;
  }

  get listResponseKey() {
    return 'secret_stores';
  }

  get mapper() {
    return (data) => {
      const { secret_store_ref } = data;
      const id = secret_store_ref
        ? secret_store_ref.split('/secret-stores/').pop()
        : '';
      return {
        ...data,
        id,
      };
    };
  }

  @action
  async setPreferred(storeId) {
    return this.client.preferred.create(storeId);
  }

  @action
  async removePreferred(storeId) {
    return this.client.preferred.delete(storeId);
  }
}

const globalSecretStoresStore = new SecretStoresStore();
export default globalSecretStoresStore;
