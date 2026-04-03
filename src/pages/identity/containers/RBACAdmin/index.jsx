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

import React from 'react';
import { observer, inject } from 'mobx-react';
import {
  Table,
  Tabs,
  Tag,
  Button,
  Modal,
  Form,
  Select,
  Spin,
  Popconfirm,
  message,
  Checkbox,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { Panel } = Collapse;

const SYSTEM_ROLES = [
  'admin',
  'member',
  'reader',
  'service',
  'manager',
  'heat_stack_owner',
  'heat_stack_user',
  'observer',
  'creator',
  'audit',
];

const ROLE_COLORS = {
  admin: 'red',
  member: 'blue',
  reader: 'orange',
  service: 'purple',
};

const SERVICE_LABELS = {
  nova: 'Compute',
  cinder: 'Storage',
  neutron: 'Networking',
  glance: 'Images',
  keystone: 'Identity',
  heat: 'Orchestration',
  octavia: 'Load Balancer',
  manila: 'Shared File Systems',
  designate: 'DNS',
  barbican: 'Key Manager',
  magnum: 'Container Infra',
  masakari: 'Instance HA',
  ceilometer: 'Telemetry',
  watcher: 'Optimization',
  swift: 'Object Storage',
  ironic: 'Bare Metal',
};

const SERVICE_ORDER = [
  'nova',
  'cinder',
  'neutron',
  'glance',
  'keystone',
  'heat',
  'octavia',
  'manila',
  'designate',
  'barbican',
  'magnum',
  'masakari',
  'ceilometer',
  'watcher',
  'swift',
  'ironic',
];

const SERVICE_ACCOUNTS = [
  'nova',
  'neutron',
  'cinder',
  'glance',
  'heat',
  'octavia',
  'manila',
  'designate',
  'barbican',
  'magnum',
  'masakari',
  'ceilometer',
  'watcher',
  'swift',
  'ironic',
  'placement',
  'skyline',
  'gnocchi',
  'aodh',
  'panko',
  'cloudkitty',
  'mistral',
  'zun',
  'cyborg',
  'blazar',
  'trove',
  'sahara',
  'senlin',
  'solum',
  'vitrage',
  'murano',
  'congress',
  'monasca',
  'freezer',
  'karbor',
  'tacker',
  'qinling',
  'zaqar',
  'rally',
  'tempest',
  'kuryr',
  'ec2api',
  'searchlight',
];

function isSystemRole(name) {
  if (SYSTEM_ROLES.includes(name)) return true;
  if (name.startsWith('load-balancer_')) return true;
  if (name.startsWith('key-manager:')) return true;
  return false;
}

async function apiFetch(url, options = {}) {
  const resp = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    let errorMsg = `Request failed: ${resp.status}`;
    try {
      errorMsg = await resp.text();
    } catch (e) {
      /* ignore */
    }
    throw new Error(errorMsg);
  }
  if (resp.status === 204 || resp.headers.get('content-length') === '0') {
    return null;
  }
  try {
    return await resp.json();
  } catch (e) {
    throw new Error('Invalid response format');
  }
}

export class RBACAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      matrixData: null,
      roles: [],
      users: [],
      assignments: [],
      projects: [],
      savedPermissions: {},
      assignmentsLoaded: false,
      assignmentsLoading: false,

      // Main tabs
      activeMainTab: 'custom',

      // Roles table
      selectedRowKeys: [],

      // Permission modal
      permModalVisible: false,
      editingRole: null,
      modalPermissions: {},
      modalActiveTab: 'nova',
      modalSaving: false,

      // Assign role modal
      assignModalVisible: false,
      assignUserId: undefined,
      assignRoleId: undefined,
      assignProjectId: undefined,
      assignRoleLoading: false,
    };
  }

  componentDidMount() {
    this.fetchAll();
  }

  fetchAll = async () => {
    this.setState({ loading: true, error: null });
    try {
      // Fetch only what's needed for initial load (roles tab):
      // matrix + roles + permissions. Users/assignments/projects loaded lazily.
      const results = await Promise.allSettled([
        apiFetch('/api/v1/rbac/matrix'),
        apiFetch('/api/v1/rbac/roles'),
        apiFetch('/api/v1/rbac/permissions').catch(() => ({ roles: [] })),
      ]);

      const matrixResult = results[0];
      const rolesResult = results[1];
      const permResult = results[2];

      if (matrixResult.status === 'rejected') {
        this.setState({ error: 'service_unavailable', loading: false });
        return;
      }

      const matrixData = matrixResult.value;
      const rolesData =
        rolesResult.status === 'fulfilled' ? rolesResult.value : null;
      const permData =
        permResult.status === 'fulfilled' ? permResult.value : { roles: [] };

      const roles = rolesData ? rolesData.roles || [] : [];

      const savedPermissions = {};
      (permData.roles || []).forEach((rp) => {
        savedPermissions[rp.role_name] = {};
        (rp.permissions || []).forEach((p) => {
          savedPermissions[rp.role_name][`${p.service}:${p.action}`] =
            p.allowed;
        });
      });

      this.setState({
        matrixData,
        roles,
        savedPermissions,
        loading: false,
        error: null,
      });
    } catch (err) {
      this.setState({ error: 'service_unavailable', loading: false });
    }
  };

  fetchAssignmentsData = async () => {
    if (this.state.assignmentsLoaded) return;
    this.setState({ assignmentsLoading: true });
    try {
      const [usersData, assignmentsData, projectsData] =
        await Promise.allSettled([
          apiFetch('/api/v1/rbac/users'),
          apiFetch('/api/v1/rbac/assignments'),
          apiFetch('/api/v1/rbac/projects'),
        ]);

      const users =
        usersData.status === 'fulfilled' ? usersData.value.users || [] : [];
      const assignments =
        assignmentsData.status === 'fulfilled'
          ? assignmentsData.value.assignments || []
          : [];
      const projects =
        projectsData.status === 'fulfilled'
          ? projectsData.value.projects || []
          : [];

      this.setState({
        users,
        assignments,
        projects,
        assignmentsLoaded: true,
        assignmentsLoading: false,
      });
    } catch (err) {
      this.setState({ assignmentsLoading: false });
    }
  };

  getAvailableServices = () => {
    const { matrixData } = this.state;
    if (!matrixData || !matrixData.services) return SERVICE_ORDER;
    const available = matrixData.services.map((s) => s.service);
    const ordered = SERVICE_ORDER.filter((s) => available.includes(s));
    available.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });
    return ordered;
  };

  getRolePermissionFromMatrix = (roleName, ruleKey) => {
    const { matrixData } = this.state;
    if (!matrixData || !matrixData.roles) return false;
    const roleEntry = matrixData.roles.find(
      (r) => r.role && r.role.name === roleName
    );
    if (!roleEntry || !roleEntry.permissions) return false;
    const perm = roleEntry.permissions.find((p) => p.rule === ruleKey);
    return perm ? perm.allowed : false;
  };

  // --- Roles data helpers ---

  getCustomRolesData = () => {
    const { roles, savedPermissions } = this.state;
    return roles
      .filter((r) => {
        const system = isSystemRole(r.name);
        const hasDbPerms = !!savedPermissions[r.name];
        return !(system && !hasDbPerms);
      })
      .map((r) => ({
        key: r.id,
        id: r.id,
        name: r.name,
        description: r.description || '-',
        isSystem: false,
      }));
  };

  getSystemRolesData = () => {
    const { roles, savedPermissions } = this.state;
    return roles
      .filter((r) => {
        const system = isSystemRole(r.name);
        const hasDbPerms = !!savedPermissions[r.name];
        return system && !hasDbPerms;
      })
      .map((r) => ({
        key: r.id,
        id: r.id,
        name: r.name,
        description: r.description || '-',
        isSystem: true,
      }));
  };

  // --- Custom roles table columns ---

  getCustomRolesColumns = () => [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => (
        <span>
          <span
            role="button"
            tabIndex={0}
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => this.handleManagePermissions(record)}
            onKeyPress={() => this.handleManagePermissions(record)}
          >
            Manage Permissions
          </span>
          <span style={{ margin: '0 8px', color: '#f0f0f0' }}>|</span>
          <Popconfirm
            title={`Delete role "${record.name}"? This cannot be undone.`}
            onConfirm={() => this.handleDeleteRoleById(record.id, record.name)}
            okText="Yes"
            cancelText="No"
          >
            <span
              role="button"
              tabIndex={0}
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
            >
              Delete
            </span>
          </Popconfirm>
        </span>
      ),
    },
  ];

  // --- System roles table columns ---

  getSystemRolesColumns = () => [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => (
        <span
          style={{ color: 'rgba(0,0,0,0.25)', cursor: 'not-allowed' }}
          onClick={() =>
            message.warning(
              `System role "${record.name}" cannot be modified. Create a custom role to assign permissions.`
            )
          }
        >
          Manage Permissions
        </span>
      ),
    },
  ];

  handleManagePermissions = (record) => {
    const { savedPermissions } = this.state;
    const perms = savedPermissions[record.name]
      ? { ...savedPermissions[record.name] }
      : {};
    const services = this.getAvailableServices();
    this.setState({
      permModalVisible: true,
      editingRole: record.name,
      modalPermissions: perms,
      modalActiveTab: services[0] || 'nova',
    });
  };

  // --- Delete roles ---

  handleDeleteRoleById = async (roleId, roleName) => {
    try {
      await apiFetch(`/api/v1/rbac/roles/${roleId}`, { method: 'DELETE' });
      message.success(`Role "${roleName}" deleted`);
      this.fetchAll();
    } catch (err) {
      message.error(`Failed to delete role: ${err.message}`);
    }
  };

  handleBulkDelete = async () => {
    const { selectedRowKeys, roles } = this.state;
    const toDelete = selectedRowKeys.filter((id) => {
      const role = roles.find((r) => r.id === id);
      return role && !isSystemRole(role.name);
    });
    if (toDelete.length === 0) {
      message.warning('No custom roles selected for deletion.');
      return;
    }
    try {
      await Promise.all(
        toDelete.map((id) =>
          apiFetch(`/api/v1/rbac/roles/${id}`, { method: 'DELETE' })
        )
      );
      message.success(`${toDelete.length} role(s) deleted`);
      this.setState({ selectedRowKeys: [] });
      this.fetchAll();
    } catch (err) {
      message.error(`Failed to delete roles: ${err.message}`);
    }
  };

  // --- Permission modal ---

  getServiceCategories = (serviceName) => {
    const { matrixData } = this.state;
    if (!matrixData || !matrixData.services) return {};
    const serviceData = matrixData.services.find(
      (s) => s.service === serviceName
    );
    if (!serviceData) return {};
    return serviceData.categories || {};
  };

  handleModalToggle = (ruleKey, checked) => {
    this.setState((prev) => ({
      modalPermissions: {
        ...prev.modalPermissions,
        [ruleKey]: checked,
      },
    }));
  };

  handleSelectAllCategory = (rules, checked) => {
    this.setState((prev) => {
      const updated = { ...prev.modalPermissions };
      (rules || []).forEach((rule) => {
        const ruleKey = rule.rule || '';
        if (ruleKey) {
          updated[ruleKey] = checked;
        }
      });
      return { modalPermissions: updated };
    });
  };

  getCategoryCheckState = (rules) => {
    const { modalPermissions, editingRole } = this.state;
    let allChecked = true;
    let noneChecked = true;
    (rules || []).forEach((rule) => {
      const ruleKey = rule.rule || '';
      if (!ruleKey) return;
      const val =
        ruleKey in modalPermissions
          ? modalPermissions[ruleKey]
          : this.getRolePermissionFromMatrix(editingRole, ruleKey);
      if (val) {
        noneChecked = false;
      } else {
        allChecked = false;
      }
    });
    return {
      checked: allChecked && !noneChecked,
      indeterminate: !allChecked && !noneChecked,
    };
  };

  handleSavePermissions = async () => {
    const { editingRole, modalPermissions } = this.state;
    if (!editingRole) return;
    this.setState({ modalSaving: true });
    try {
      const permList = Object.entries(modalPermissions).map(
        ([key, allowed]) => {
          const idx = key.indexOf(':');
          return {
            service: key.substring(0, idx),
            action: key.substring(idx + 1),
            allowed,
          };
        }
      );
      await apiFetch('/api/v1/rbac/permissions', {
        method: 'PUT',
        body: JSON.stringify({
          role_name: editingRole,
          permissions: permList,
        }),
      });
      message.success(`Permissions saved for ${editingRole}`);
      this.setState((prev) => ({
        modalSaving: false,
        permModalVisible: false,
        editingRole: null,
        modalPermissions: {},
        savedPermissions: {
          ...prev.savedPermissions,
          [editingRole]: { ...prev.modalPermissions },
        },
      }));
    } catch (err) {
      message.error(`Failed to save: ${err.message}`);
      this.setState({ modalSaving: false });
    }
  };

  handleModalTabChange = (key) => {
    this.setState({ modalActiveTab: key });
  };

  handlePrevTab = () => {
    const services = this.getAvailableServices();
    const { modalActiveTab } = this.state;
    const idx = services.indexOf(modalActiveTab);
    if (idx > 0) {
      this.setState({ modalActiveTab: services[idx - 1] });
    }
  };

  handleNextTab = () => {
    const services = this.getAvailableServices();
    const { modalActiveTab } = this.state;
    const idx = services.indexOf(modalActiveTab);
    if (idx < services.length - 1) {
      this.setState({ modalActiveTab: services[idx + 1] });
    }
  };

  // --- Assignments ---

  handleAssignRole = async () => {
    const { assignUserId, assignRoleId, assignProjectId, roles } = this.state;
    if (!assignUserId || !assignRoleId || !assignProjectId) {
      message.warning('All fields are required');
      return;
    }
    this.setState({ assignRoleLoading: true });
    try {
      await apiFetch('/api/v1/rbac/assignments', {
        method: 'POST',
        body: JSON.stringify({
          user_id: assignUserId,
          role_id: assignRoleId,
          project_id: assignProjectId,
        }),
      });
      const selectedRole = roles.find((r) => r.id === assignRoleId);
      if (selectedRole && !isSystemRole(selectedRole.name)) {
        const memberRole = roles.find((r) => r.name === 'member');
        if (memberRole) {
          try {
            await apiFetch('/api/v1/rbac/assignments', {
              method: 'POST',
              body: JSON.stringify({
                user_id: assignUserId,
                role_id: memberRole.id,
                project_id: assignProjectId,
              }),
            });
          } catch (e) {
            // member role may already be assigned — ignore conflict
          }
        }
      }
      message.success('Role assigned successfully');
      this.setState({
        assignModalVisible: false,
        assignUserId: undefined,
        assignRoleId: undefined,
        assignProjectId: undefined,
        assignRoleLoading: false,
        assignmentsLoaded: false,
      });
      this.fetchAssignmentsData();
    } catch (err) {
      message.error(`Failed to assign role: ${err.message}`);
      this.setState({ assignRoleLoading: false });
    }
  };

  handleRevokeAssignment = async (userId, roleId, projectId) => {
    try {
      await apiFetch('/api/v1/rbac/assignments', {
        method: 'DELETE',
        body: JSON.stringify({
          user_id: userId,
          role_id: roleId,
          project_id: projectId,
        }),
      });
      message.success('Assignment revoked');
      this.setState({ assignmentsLoaded: false });
      this.fetchAssignmentsData();
    } catch (err) {
      message.error(`Failed to revoke assignment: ${err.message}`);
    }
  };

  getFilteredAssignments = () => {
    const { assignments } = this.state;
    const lowerAccounts = SERVICE_ACCOUNTS.map((s) => s.toLowerCase());
    return assignments.filter(
      (a) => !lowerAccounts.includes((a.user_name || '').toLowerCase())
    );
  };

  getAssignmentColumns = () => [
    {
      title: 'User',
      dataIndex: 'user_name',
      key: 'user_name',
      sorter: (a, b) => (a.user_name || '').localeCompare(b.user_name || ''),
    },
    {
      title: 'Role',
      dataIndex: 'role_name',
      key: 'role_name',
      sorter: (a, b) => (a.role_name || '').localeCompare(b.role_name || ''),
      render: (text) => (
        <Tag color={ROLE_COLORS[text] || 'default'}>{text}</Tag>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'project_name',
      key: 'project_name',
      sorter: (a, b) =>
        (a.project_name || '').localeCompare(b.project_name || ''),
    },
    {
      title: 'Action',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Revoke this role assignment?"
          onConfirm={() =>
            this.handleRevokeAssignment(
              record.user_id,
              record.role_id,
              record.project_id
            )
          }
          okText="Yes"
          cancelText="No"
        >
          <span
            role="button"
            tabIndex={0}
            style={{ color: '#ff4d4f', cursor: 'pointer' }}
          >
            Revoke
          </span>
        </Popconfirm>
      ),
    },
  ];

  // --- Render: Custom Roles tab ---

  renderCustomRolesTab() {
    const { loading, selectedRowKeys } = this.state;
    const data = this.getCustomRolesData();
    const columns = this.getCustomRolesColumns();

    const hasCustomSelected = selectedRowKeys.some((id) => {
      const row = data.find((r) => r.key === id);
      return !!row;
    });

    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {hasCustomSelected && (
            <Popconfirm
              title="Delete selected custom roles? This cannot be undone."
              onConfirm={this.handleBulkDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </div>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => this.setState({ selectedRowKeys: keys }),
          }}
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} Items`,
          }}
          size="middle"
          loading={loading}
        />
      </div>
    );
  }

  // --- Render: System Roles tab ---

  renderSystemRolesTab() {
    const { loading } = this.state;
    const data = this.getSystemRolesData();
    const columns = this.getSystemRolesColumns();

    return (
      <div>
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} Items`,
          }}
          size="middle"
          loading={loading}
        />
      </div>
    );
  }

  // --- Render: Assignments tab ---

  renderAssignmentsTab() {
    const { assignmentsLoading, assignmentsLoaded } = this.state;
    const loading = assignmentsLoading || !assignmentsLoaded;
    const filteredAssignments = this.getFilteredAssignments();

    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => this.setState({ assignModalVisible: true })}
          >
            Assign Role
          </Button>
        </div>
        <Table
          columns={this.getAssignmentColumns()}
          dataSource={filteredAssignments.map((a, i) => ({
            ...a,
            key: `${a.user_id}-${a.role_id}-${a.project_id}-${i}`,
          }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} Items`,
          }}
          size="middle"
          loading={loading}
        />
      </div>
    );
  }

  // --- Render: Permission modal ---

  renderPermissionModal() {
    const {
      permModalVisible,
      editingRole,
      modalActiveTab,
      modalSaving,
      modalPermissions,
    } = this.state;

    const services = this.getAvailableServices();
    const tabIdx = services.indexOf(modalActiveTab);
    const categories = this.getServiceCategories(modalActiveTab);
    const categoryEntries = Object.entries(categories);

    return (
      <Modal
        title={`Manage Permissions: ${editingRole || ''}`}
        visible={permModalVisible}
        width={800}
        bodyStyle={{ padding: 0, maxHeight: '60vh', overflow: 'auto' }}
        onCancel={() =>
          this.setState({
            permModalVisible: false,
            editingRole: null,
            modalPermissions: {},
          })
        }
        footer={[
          <Button
            key="cancel"
            onClick={() =>
              this.setState({
                permModalVisible: false,
                editingRole: null,
                modalPermissions: {},
              })
            }
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={modalSaving}
            onClick={this.handleSavePermissions}
          >
            Save Permissions
          </Button>,
        ]}
      >
        <div style={{ padding: '0 16px' }}>
          <Tabs
            activeKey={modalActiveTab}
            onChange={this.handleModalTabChange}
            style={{ marginBottom: 0 }}
          >
            {services.map((svc) => (
              <TabPane tab={SERVICE_LABELS[svc] || svc} key={svc} />
            ))}
          </Tabs>
        </div>

        <div style={{ padding: '0 16px 16px 16px' }}>
          {categoryEntries.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              No permissions available for this service.
            </div>
          )}
          {categoryEntries.length > 0 && (
            <Collapse
              defaultActiveKey={
                categoryEntries.length > 0 ? [categoryEntries[0][0]] : []
              }
              style={{ background: '#fff', border: 'none' }}
            >
              {categoryEntries.map(([catName, rules]) => {
                const checkState = this.getCategoryCheckState(rules);
                const header = (
                  <span style={{ fontWeight: 500 }}>{catName}</span>
                );
                return (
                  <Panel
                    key={catName}
                    header={header}
                    extra={
                      <Checkbox
                        checked={checkState.checked}
                        indeterminate={checkState.indeterminate}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          this.handleSelectAllCategory(rules, e.target.checked)
                        }
                      >
                        Select All
                      </Checkbox>
                    }
                  >
                    {(rules || []).map((rule) => {
                      const ruleKey = rule.rule || '';
                      if (!ruleKey) return null;
                      const checked =
                        ruleKey in modalPermissions
                          ? modalPermissions[ruleKey]
                          : this.getRolePermissionFromMatrix(
                              editingRole,
                              ruleKey
                            );
                      return (
                        <div
                          key={ruleKey}
                          style={{
                            paddingLeft: 16,
                            marginBottom: 8,
                          }}
                        >
                          <Checkbox
                            checked={!!checked}
                            onChange={(e) =>
                              this.handleModalToggle(ruleKey, e.target.checked)
                            }
                          >
                            {rule.label || rule.rule}
                          </Checkbox>
                        </div>
                      );
                    })}
                  </Panel>
                );
              })}
            </Collapse>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 16,
            }}
          >
            {tabIdx > 0 ? (
              <Button icon={<LeftOutlined />} onClick={this.handlePrevTab}>
                Previous:{' '}
                {SERVICE_LABELS[services[tabIdx - 1]] || services[tabIdx - 1]}
              </Button>
            ) : (
              <span />
            )}
            {tabIdx < services.length - 1 ? (
              <Button onClick={this.handleNextTab}>
                Next:{' '}
                {SERVICE_LABELS[services[tabIdx + 1]] || services[tabIdx + 1]}{' '}
                <RightOutlined />
              </Button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </Modal>
    );
  }

  // --- Render: Assign Role modal ---

  renderAssignRoleModal() {
    const {
      assignModalVisible,
      assignUserId,
      assignRoleId,
      assignProjectId,
      assignRoleLoading,
      users,
      roles,
      projects,
    } = this.state;

    return (
      <Modal
        title="Assign Role to User"
        visible={assignModalVisible}
        onOk={this.handleAssignRole}
        onCancel={() =>
          this.setState({
            assignModalVisible: false,
            assignUserId: undefined,
            assignRoleId: undefined,
            assignProjectId: undefined,
          })
        }
        confirmLoading={assignRoleLoading}
        okText="Assign"
      >
        <Form layout="vertical">
          <Form.Item label="User" required>
            <Select
              showSearch
              value={assignUserId}
              onChange={(val) => this.setState({ assignUserId: val })}
              placeholder="Select a user"
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  {u.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Role" required>
            <Select
              value={assignRoleId}
              onChange={(val) => this.setState({ assignRoleId: val })}
              placeholder="Select a role"
              style={{ width: '100%' }}
            >
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Project" required>
            <Select
              showSearch
              value={assignProjectId}
              onChange={(val) => this.setState({ assignProjectId: val })}
              placeholder="Select a project"
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {projects.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  render() {
    const { loading, matrixData, error, activeMainTab } = this.state;

    if (loading && !matrixData) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <Spin size="large" tip="Loading RBAC data..." />
        </div>
      );
    }

    if (error && !matrixData) {
      return (
        <div style={{ textAlign: 'center', paddingTop: 120 }}>
          <span
            style={{
              color: '#ff4d4f',
              fontSize: 16,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Service temporarily unavailable.
          </span>
          <span
            style={{
              color: 'rgba(0,0,0,0.45)',
              display: 'block',
              marginBottom: 16,
            }}
          >
            Please try again later.
          </span>
          <Button type="primary" onClick={this.fetchAll}>
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div
        style={{
          minHeight: 'calc(100vh - 108px)',
          marginTop: 16,
          padding: '0 16px',
        }}
      >
        <Tabs
          activeKey={activeMainTab}
          onChange={(key) => {
            this.setState({ activeMainTab: key });
            if (key === 'assignments') {
              this.fetchAssignmentsData();
            }
          }}
        >
          <TabPane tab="Custom Roles" key="custom">
            {this.renderCustomRolesTab()}
          </TabPane>
          <TabPane tab="System Roles" key="system">
            {this.renderSystemRolesTab()}
          </TabPane>
          <TabPane tab="Role Assignments" key="assignments">
            {this.renderAssignmentsTab()}
          </TabPane>
        </Tabs>
        {this.renderAssignRoleModal()}
        {this.renderPermissionModal()}
      </div>
    );
  }
}

export default inject('rootStore')(observer(RBACAdmin));
