// Stub RBAC permissions store — RBAC feature is not enabled on this branch.
// All actions are allowed by default. When RBAC is enabled, this file is
// replaced by the real store from the Ankur-SkylineRBAC branch.

class RBACPermissionsStore {
  isAllowed() {
    return true;
  }
}

const globalRBACPermissionsStore = new RBACPermissionsStore();
export default globalRBACPermissionsStore;
