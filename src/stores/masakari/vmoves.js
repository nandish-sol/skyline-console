import client from 'client';
import { action, observable } from 'mobx';

export class VMoveStore {
  @observable vmoveList = [];

  @observable isLoading = false;

  get client() {
    return client.masakari.notifications.vmoves;
  }

  @action
  async fetchVMoves(notificationId) {
    this.isLoading = true;
    try {
      const result = await this.client.list(notificationId);
      this.vmoveList = (result && result.vmoves) || [];
    } catch (e) {
      this.vmoveList = [];
    }
    this.isLoading = false;
    return this.vmoveList;
  }
}

const globalVMoveStore = new VMoveStore();
export default globalVMoveStore;
