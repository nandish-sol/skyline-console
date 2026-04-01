import { observable, action, computed } from 'mobx';
import client from 'client';

const POLL_INTERVAL = 5000;
const AUTO_DISMISS_DELAY = 8000;

class OperationTracker {
  @observable operations = [];

  nextId = 0;

  @computed get activeOperations() {
    return this.operations.filter(
      (op) => op.status === 'running' || op.status === 'completed' || op.status === 'failed'
    );
  }

  @action
  track({ type, name, resourceId, resourceType, description, pollFn }) {
    const id = this.nextId;
    this.nextId += 1;
    const op = observable({
      id,
      type,
      name,
      resourceId,
      resourceType,
      description,
      status: 'running',
      startTime: Date.now(),
      elapsed: '0s',
      error: null,
      result: null,
    });
    this.operations.push(op);
    this.startPolling(op, pollFn);
    return id;
  }

  startPolling(op, pollFn) {
    if (!pollFn) return;
    const timer = setInterval(
      action(async () => {
        try {
          const result = await pollFn(op.resourceId);
          op.elapsed = this.formatElapsed(Date.now() - op.startTime);
          if (result.done) {
            clearInterval(timer);
            op.status = result.success ? 'completed' : 'failed';
            op.result = result.message || null;
            op.error = result.error || null;
            setTimeout(
              action(() => {
                this.dismiss(op.id);
              }),
              AUTO_DISMISS_DELAY
            );
          }
        } catch (e) {
          op.elapsed = this.formatElapsed(Date.now() - op.startTime);
        }
      }),
      POLL_INTERVAL
    );

    // Update elapsed time every second
    const elapsedTimer = setInterval(
      action(() => {
        if (op.status !== 'running') {
          clearInterval(elapsedTimer);
          return;
        }
        op.elapsed = this.formatElapsed(Date.now() - op.startTime);
      }),
      1000
    );
  }

  formatElapsed(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}m ${rs}s`;
  }

  @action
  dismiss(id) {
    this.operations = this.operations.filter((op) => op.id !== id);
  }

  @action
  clearAll() {
    this.operations = [];
  }
}

// Poll functions for common operations
export const pollServerStatus = async (serverId) => {
  try {
    const result = await client.nova.servers.show(serverId);
    const { server } = result;
    const status = (server && server.status) || '';
    if (status === 'ACTIVE') {
      return { done: true, success: true, message: 'Server is ACTIVE' };
    }
    if (status === 'ERROR') {
      return { done: true, success: false, error: 'Server in ERROR state' };
    }
    if (status === 'DELETED') {
      return { done: true, success: true, message: 'Server deleted' };
    }
    return { done: false };
  } catch (e) {
    if (e && e.status === 404) {
      return { done: true, success: true, message: 'Resource deleted' };
    }
    return { done: false };
  }
};

export const pollMigrationStatus = async (serverId) => {
  try {
    const result = await client.nova.servers.show(serverId);
    const { server } = result;
    const status = (server && server.status) || '';
    const taskState = (server && server['OS-EXT-STS:task_state']) || null;
    if (status === 'ACTIVE' && !taskState) {
      return { done: true, success: true, message: 'Migration complete' };
    }
    if (status === 'ERROR') {
      return { done: true, success: false, error: 'Migration failed' };
    }
    return { done: false };
  } catch (e) {
    return { done: false };
  }
};

export const pollVolumeStatus = async (volumeId) => {
  try {
    const result = await client.cinder.volumes.show(volumeId);
    const { volume } = result;
    const status = (volume && volume.status) || '';
    if (status === 'available' || status === 'in-use') {
      return { done: true, success: true, message: `Volume is ${status}` };
    }
    if (status === 'error') {
      return { done: true, success: false, error: 'Volume error' };
    }
    return { done: false };
  } catch (e) {
    return { done: false };
  }
};

export const pollBackupStatus = async (backupId) => {
  try {
    const result = await client.cinder.backups.show(backupId);
    const { backup } = result;
    const status = (backup && backup.status) || '';
    if (status === 'available') {
      return { done: true, success: true, message: 'Backup complete' };
    }
    if (status === 'error') {
      return { done: true, success: false, error: 'Backup failed' };
    }
    return { done: false };
  } catch (e) {
    return { done: false };
  }
};

export const pollSnapshotStatus = async (imageId) => {
  try {
    const result = await client.glance.images.show(imageId);
    const status = (result && result.status) || '';
    if (status === 'active') {
      return { done: true, success: true, message: 'Snapshot ready' };
    }
    if (status === 'killed' || status === 'deleted') {
      return { done: true, success: false, error: 'Snapshot failed' };
    }
    return { done: false };
  } catch (e) {
    return { done: false };
  }
};

const globalOperationTracker = new OperationTracker();
export default globalOperationTracker;
