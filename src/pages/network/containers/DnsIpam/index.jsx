import React from 'react';
import { observer, inject } from 'mobx-react';
import { skylineBase } from 'client/client/constants';
import {
  Table,
  Tabs,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Popconfirm,
  message,
  Progress,
  Badge,
  Card,
  Row,
  Col,
  Checkbox,
  Tooltip,
  Icon,
} from 'antd';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const PROVIDER_TYPES = {
  infoblox: 'Infoblox DDI',
  powerdns: 'PowerDNS',
  msdns: 'Microsoft DNS',
};

const STATUS_COLORS = {
  active: 'green',
  error: 'red',
  unknown: 'default',
};

const API_PLACEHOLDERS = {
  infoblox: 'https://infoblox-ip/wapi/v2.12/',
  powerdns: 'http://powerdns-ip:8081',
  msdns: 'dns://dns-server-ip',
};

const CAPABILITIES = {
  infoblox: { ipam: true, conflicts: true, reserve: true },
  powerdns: { ipam: false, conflicts: false, reserve: false },
  msdns: { ipam: false, conflicts: false, reserve: false },
};

async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('/api/v1')
    ? `${skylineBase()}${url.slice('/api/v1'.length)}`
    : url;
  const resp = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp.json();
}

@inject('rootStore')
@observer
export default class DnsIpam extends React.Component {
  state = {
    loading: false,
    connections: [],
    activeTab: 'connections',
    // Add Connection modal
    addVisible: false,
    addLoading: false,
    addForm: {
      provider_type: 'infoblox',
      name: '',
      api_url: '',
      username: '',
      password: '',
      dns_view: 'default',
      network_view: 'default',
      ns_group: '',
      site_name: '',
      ssl_verify: false,
    },
    editId: null,
    // DNS Overview
    overviewConnId: null,
    providerZones: [],
    designateZones: [],
    zonesLoading: false,
    // IPAM
    ipamConnId: null,
    networks: [],
    addresses: [],
    networksLoading: false,
    addressesLoading: false,
    selectedNetwork: null,
    // Reserve IP modal
    reserveVisible: false,
    reserveLoading: false,
    reserveForm: { ipv4addr: '', mac: '', hostname: '', comment: '' },
    // Monitoring
    conflicts: [],
    members: [],
    monitorLoading: false,
    monitorConnId: null,
    // Pool
    pools: [],
    poolVisible: false,
    poolLoading: false,
    poolForm: {
      connection_id: '',
      pool_name: 'infoblox-pool',
      ns_hostname: '',
      nameserver_host: '',
      mdns_host: '10.0.1.70',
    },
    poolSnippet: null,
  };

  componentDidMount() {
    this.loadConnections();
  }

  async loadConnections() {
    this.setState({ loading: true });
    try {
      const data = await apiFetch('/api/v1/dns-ipam/connections');
      this.setState({ connections: data });
    } catch (e) {
      message.error(`Failed to load connections: ${e.message}`);
    }
    this.setState({ loading: false });
  }

  // ===================== Connection CRUD =====================

  async handleAddConnection() {
    const { addForm, editId } = this.state;
    this.setState({ addLoading: true });
    try {
      if (editId) {
        const body = { ...addForm };
        if (!body.password) delete body.password;
        await apiFetch(`/api/v1/dns-ipam/connections/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        message.success('Connection updated');
      } else {
        await apiFetch('/api/v1/dns-ipam/connections', {
          method: 'POST',
          body: JSON.stringify(addForm),
        });
        message.success('Connection created');
      }
      this.setState({
        addVisible: false,
        editId: null,
        addForm: {
          provider_type: 'infoblox', name: '', api_url: '', username: '',
          password: '', dns_view: 'default', network_view: 'default',
          ns_group: '', site_name: '', ssl_verify: false,
        },
      });
      this.loadConnections();
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ addLoading: false });
  }

  async handleTestConnection(id) {
    try {
      const result = await apiFetch(`/api/v1/dns-ipam/connections/${id}/test`, {
        method: 'POST',
      });
      if (result.ok) {
        message.success(`Connected: ${result.message}`);
      } else {
        message.error(`Test failed: ${result.message}`);
      }
      this.loadConnections();
    } catch (e) {
      message.error(e.message);
    }
  }

  async handleDeleteConnection(id) {
    try {
      await apiFetch(`/api/v1/dns-ipam/connections/${id}`, { method: 'DELETE' });
      message.success('Connection deleted');
      this.loadConnections();
    } catch (e) {
      message.error(e.message);
    }
  }

  handleEditConnection(conn) {
    this.setState({
      editId: conn.id,
      addForm: {
        provider_type: conn.provider_type,
        name: conn.name,
        api_url: conn.api_url,
        username: conn.username,
        password: '',
        dns_view: conn.dns_view,
        network_view: conn.network_view,
        ns_group: conn.ns_group,
        site_name: conn.site_name,
        ssl_verify: conn.ssl_verify,
      },
      addVisible: true,
    });
  }

  // ===================== DNS Overview =====================

  async loadOverview(connId) {
    this.setState({ zonesLoading: true, overviewConnId: connId });
    try {
      const [providerZones, designateZones] = await Promise.all([
        connId
          ? apiFetch(`/api/v1/dns-ipam/connections/${connId}/zones`)
          : Promise.resolve([]),
        apiFetch('/api/v1/dns-ipam/designate-zones').catch(() => []),
      ]);
      this.setState({ providerZones, designateZones });
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ zonesLoading: false });
  }

  // ===================== IPAM =====================

  async loadNetworks(connId) {
    this.setState({ networksLoading: true, ipamConnId: connId, addresses: [], selectedNetwork: null });
    try {
      const networks = await apiFetch(`/api/v1/dns-ipam/connections/${connId}/networks`);
      this.setState({ networks });
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ networksLoading: false });
  }

  async loadAddresses(connId, network) {
    this.setState({ addressesLoading: true, selectedNetwork: network });
    try {
      const addresses = await apiFetch(
        `/api/v1/dns-ipam/connections/${connId}/networks/${encodeURIComponent(network)}/addresses`
      );
      this.setState({ addresses });
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ addressesLoading: false });
  }

  async handleReserveIP() {
    const { ipamConnId, reserveForm } = this.state;
    this.setState({ reserveLoading: true });
    try {
      await apiFetch(`/api/v1/dns-ipam/connections/${ipamConnId}/ip/reserve`, {
        method: 'POST',
        body: JSON.stringify(reserveForm),
      });
      message.success(`IP ${reserveForm.ipv4addr} reserved`);
      this.setState({
        reserveVisible: false,
        reserveForm: { ipv4addr: '', mac: '', hostname: '', comment: '' },
      });
      if (this.state.selectedNetwork) {
        this.loadAddresses(ipamConnId, this.state.selectedNetwork);
      }
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ reserveLoading: false });
  }

  async handleReleaseIP(connId, ref) {
    try {
      await apiFetch(`/api/v1/dns-ipam/connections/${connId}/ip/release`, {
        method: 'POST',
        body: JSON.stringify({ ref }),
      });
      message.success('IP released');
      if (this.state.selectedNetwork) {
        this.loadAddresses(connId, this.state.selectedNetwork);
      }
    } catch (e) {
      message.error(e.message);
    }
  }

  // ===================== Monitoring =====================

  async loadMonitoring(connId) {
    this.setState({ monitorLoading: true, monitorConnId: connId });
    try {
      const [members, conflicts, pools] = await Promise.all([
        apiFetch(`/api/v1/dns-ipam/connections/${connId}/members`).catch(() => []),
        CAPABILITIES[this.state.connections.find((c) => c.id === connId)?.provider_type]?.conflicts
          ? apiFetch(`/api/v1/dns-ipam/connections/${connId}/conflicts`).catch(() => [])
          : Promise.resolve([]),
        apiFetch('/api/v1/dns-ipam/pools').catch(() => []),
      ]);
      this.setState({ members, conflicts, pools });
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ monitorLoading: false });
  }

  // ===================== Pool =====================

  async handleGeneratePool() {
    this.setState({ poolLoading: true });
    try {
      const result = await apiFetch('/api/v1/dns-ipam/pools', {
        method: 'POST',
        body: JSON.stringify(this.state.poolForm),
      });
      this.setState({
        poolSnippet: result.pools_yaml_snippet,
        poolVisible: false,
      });
      message.success('Pool snippet generated');
      if (this.state.monitorConnId) {
        const pools = await apiFetch('/api/v1/dns-ipam/pools').catch(() => []);
        this.setState({ pools });
      }
    } catch (e) {
      message.error(e.message);
    }
    this.setState({ poolLoading: false });
  }

  async handleDeletePool(id) {
    try {
      await apiFetch(`/api/v1/dns-ipam/pools/${id}`, { method: 'DELETE' });
      message.success('Pool deleted');
      const pools = await apiFetch('/api/v1/dns-ipam/pools').catch(() => []);
      this.setState({ pools });
    } catch (e) {
      message.error(e.message);
    }
  }

  // ===================== Renderers =====================

  renderConnectionsTab() {
    const { connections, loading } = this.state;
    const columns = [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Provider',
        dataIndex: 'provider_type',
        key: 'provider_type',
        render: (v) => <Tag>{PROVIDER_TYPES[v] || v}</Tag>,
      },
      { title: 'API URL', dataIndex: 'api_url', key: 'api_url', ellipsis: true },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v) => <Badge status={v === 'active' ? 'success' : v === 'error' ? 'error' : 'default'} text={v} />,
      },
      { title: 'DNS View', dataIndex: 'dns_view', key: 'dns_view' },
      { title: 'Site', dataIndex: 'site_name', key: 'site_name' },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <span>
            <Button size="small" onClick={() => this.handleTestConnection(record.id)}>Test</Button>
            {' '}
            <Button size="small" onClick={() => this.handleEditConnection(record)}>Edit</Button>
            {' '}
            <Popconfirm title="Delete this connection?" onConfirm={() => this.handleDeleteConnection(record.id)}>
              <Button size="small" type="danger">Delete</Button>
            </Popconfirm>
          </span>
        ),
      },
    ];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon="plus"
            onClick={() => this.setState({
              addVisible: true,
              editId: null,
              addForm: {
                provider_type: 'infoblox', name: '', api_url: '', username: '',
                password: '', dns_view: 'default', network_view: 'default',
                ns_group: '', site_name: '', ssl_verify: false,
              },
            })}
          >
            Add Connection
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={connections}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </div>
    );
  }

  renderAddConnectionModal() {
    const { addVisible, addLoading, addForm, editId } = this.state;
    const isInfoblox = addForm.provider_type === 'infoblox';
    const isMsdns = addForm.provider_type === 'msdns';
    const setField = (k, v) => this.setState((prev) => ({ addForm: { ...prev.addForm, [k]: v } }));

    return (
      <Modal
        title={editId ? 'Edit Connection' : 'Add Connection'}
        visible={addVisible}
        onOk={() => this.handleAddConnection()}
        onCancel={() => this.setState({ addVisible: false })}
        confirmLoading={addLoading}
        width={520}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="Provider Type">
            <Select value={addForm.provider_type} onChange={(v) => setField('provider_type', v)} disabled={!!editId}>
              {Object.entries(PROVIDER_TYPES).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Name" required>
            <Input value={addForm.name} onChange={(e) => setField('name', e.target.value)} placeholder="My Infoblox" />
          </Form.Item>
          <Form.Item label="API URL" required>
            <Input
              value={addForm.api_url}
              onChange={(e) => setField('api_url', e.target.value)}
              placeholder={API_PLACEHOLDERS[addForm.provider_type]}
            />
          </Form.Item>
          {!isMsdns && (
            <Form.Item label="Username">
              <Input value={addForm.username} onChange={(e) => setField('username', e.target.value)} />
            </Form.Item>
          )}
          {!isMsdns && (
            <Form.Item label={addForm.provider_type === 'powerdns' ? 'API Key' : 'Password'}>
              <Input.Password
                value={addForm.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={editId ? 'Leave blank to keep current' : ''}
              />
            </Form.Item>
          )}
          <Form.Item label="DNS View">
            <Input
              value={addForm.dns_view}
              onChange={(e) => setField('dns_view', e.target.value)}
              placeholder={isMsdns ? 'Zone names (comma-separated)' : 'default'}
            />
          </Form.Item>
          {isInfoblox && (
            <Form.Item label="Network View">
              <Input value={addForm.network_view} onChange={(e) => setField('network_view', e.target.value)} />
            </Form.Item>
          )}
          {isInfoblox && (
            <Form.Item label="NS Group">
              <Input value={addForm.ns_group} onChange={(e) => setField('ns_group', e.target.value)} placeholder="designate" />
            </Form.Item>
          )}
          <Form.Item label="Site Name">
            <Input value={addForm.site_name} onChange={(e) => setField('site_name', e.target.value)} />
          </Form.Item>
          <Form.Item label="">
            <Checkbox checked={addForm.ssl_verify} onChange={(e) => setField('ssl_verify', e.target.checked)}>
              Verify SSL
            </Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  renderOverviewTab() {
    const { connections, overviewConnId, providerZones, designateZones, zonesLoading } = this.state;
    const activeConns = connections.filter((c) => c.status === 'active');

    const providerCols = [
      { title: 'Zone (FQDN)', dataIndex: 'fqdn', key: 'fqdn' },
      { title: 'View', dataIndex: 'view', key: 'view' },
      {
        title: 'SOA Serial',
        dataIndex: 'soa_serial',
        key: 'soa_serial',
        render: (val, record) => {
          const match = designateZones.find(
            (dz) => dz.name && record.fqdn && dz.name.replace(/\.$/, '') === record.fqdn.replace(/\.$/, '')
          );
          if (match && String(match.serial) !== String(val) && val) {
            return <Tooltip title={`Designate serial: ${match.serial}`}><span style={{ color: '#f5222d' }}>{val} ⚠</span></Tooltip>;
          }
          return val;
        },
      },
      { title: 'NS Group', dataIndex: 'ns_group', key: 'ns_group' },
    ];

    const designateCols = [
      { title: 'Zone Name', dataIndex: 'name', key: 'name' },
      { title: 'Type', dataIndex: 'type', key: 'type' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'ACTIVE' ? 'green' : 'orange'}>{v}</Tag> },
      { title: 'Serial', dataIndex: 'serial', key: 'serial' },
    ];

    return (
      <Spin spinning={zonesLoading}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Connection:</span>
          <Select
            style={{ width: 300 }}
            value={overviewConnId}
            onChange={(v) => this.loadOverview(v)}
            placeholder="Select active connection"
            allowClear
          >
            {activeConns.map((c) => (
              <Option key={c.id} value={c.id}>{c.name} ({PROVIDER_TYPES[c.provider_type]})</Option>
            ))}
          </Select>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Provider Zones" size="small">
              <Table columns={providerCols} dataSource={providerZones} rowKey="id" size="small" pagination={false} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Designate Zones" size="small">
              <Table columns={designateCols} dataSource={designateZones} rowKey="id" size="small" pagination={false} />
            </Card>
          </Col>
        </Row>
      </Spin>
    );
  }

  renderIpamTab() {
    const { connections, ipamConnId, networks, addresses, networksLoading, addressesLoading, selectedNetwork } = this.state;
    const infobloxConns = connections.filter((c) => c.provider_type === 'infoblox' && c.status === 'active');

    const netCols = [
      { title: 'Network', dataIndex: 'network', key: 'network' },
      { title: 'View', dataIndex: 'network_view', key: 'network_view' },
      { title: 'Comment', dataIndex: 'comment', key: 'comment' },
      {
        title: 'Utilization',
        dataIndex: 'utilization',
        key: 'utilization',
        render: (v) => <Progress percent={v || 0} size="small" style={{ width: 120 }} />,
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Button size="small" onClick={() => this.loadAddresses(ipamConnId, record.network)}>Browse IPs</Button>
        ),
      },
    ];

    const addrCols = [
      { title: 'IP Address', dataIndex: 'ip_address', key: 'ip_address' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v) => <Tag color={v === 'USED' ? 'blue' : v === 'UNUSED' ? 'green' : 'default'}>{v}</Tag>,
      },
      { title: 'MAC', dataIndex: 'mac_address', key: 'mac_address' },
      { title: 'Hostname', dataIndex: 'names', key: 'names', ellipsis: true },
      {
        title: 'Conflict',
        dataIndex: 'is_conflict',
        key: 'is_conflict',
        render: (v) => v ? <Tag color="red">CONFLICT</Tag> : null,
      },
    ];

    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Infoblox Connection:</span>
          <Select
            style={{ width: 300 }}
            value={ipamConnId}
            onChange={(v) => this.loadNetworks(v)}
            placeholder="Select Infoblox connection"
          >
            {infobloxConns.map((c) => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
          {ipamConnId && (
            <Button
              style={{ marginLeft: 8 }}
              icon="plus"
              onClick={() => this.setState({ reserveVisible: true })}
            >
              Reserve IP
            </Button>
          )}
        </div>
        <Table
          columns={netCols}
          dataSource={networks}
          rowKey="id"
          loading={networksLoading}
          size="small"
          pagination={false}
          style={{ marginBottom: 16 }}
        />
        {selectedNetwork && (
          <Card title={`Addresses in ${selectedNetwork}`} size="small">
            <Table
              columns={addrCols}
              dataSource={addresses}
              rowKey="id"
              loading={addressesLoading}
              size="small"
              pagination={{ pageSize: 50 }}
            />
          </Card>
        )}
      </div>
    );
  }

  renderReserveModal() {
    const { reserveVisible, reserveLoading, reserveForm } = this.state;
    const setField = (k, v) => this.setState((prev) => ({ reserveForm: { ...prev.reserveForm, [k]: v } }));
    return (
      <Modal
        title="Reserve IP Address"
        visible={reserveVisible}
        onOk={() => this.handleReserveIP()}
        onCancel={() => this.setState({ reserveVisible: false })}
        confirmLoading={reserveLoading}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="IPv4 Address" required>
            <Input value={reserveForm.ipv4addr} onChange={(e) => setField('ipv4addr', e.target.value)} placeholder="10.0.1.100" />
          </Form.Item>
          <Form.Item label="MAC Address">
            <Input value={reserveForm.mac} onChange={(e) => setField('mac', e.target.value)} placeholder="00:11:22:33:44:55" />
          </Form.Item>
          <Form.Item label="Hostname">
            <Input value={reserveForm.hostname} onChange={(e) => setField('hostname', e.target.value)} />
          </Form.Item>
          <Form.Item label="Comment">
            <TextArea value={reserveForm.comment} onChange={(e) => setField('comment', e.target.value)} rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  renderMonitoringTab() {
    const { connections, monitorConnId, members, conflicts, pools, monitorLoading, poolSnippet } = this.state;
    const activeConns = connections.filter((c) => c.status === 'active');

    const memberCols = [
      { title: 'Hostname', dataIndex: 'host_name', key: 'host_name' },
      { title: 'IP', dataIndex: 'ipv4addr', key: 'ipv4addr' },
      { title: 'Platform', dataIndex: 'platform', key: 'platform' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (v) => <Tag color={v === 'WORKING' || v === 'ACTIVE' ? 'green' : 'orange'}>{v}</Tag>,
      },
    ];

    const conflictCols = [
      { title: 'IP', dataIndex: 'ip_address', key: 'ip_address' },
      { title: 'Network', dataIndex: 'network', key: 'network' },
      { title: 'MAC', dataIndex: 'mac_address', key: 'mac_address' },
      { title: 'Names', dataIndex: 'names', key: 'names' },
    ];

    const poolCols = [
      { title: 'Pool Name', dataIndex: 'pool_name', key: 'pool_name' },
      { title: 'NS Hostname', dataIndex: 'ns_hostname', key: 'ns_hostname' },
      { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag>{v}</Tag> },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <span>
            <Button size="small" onClick={() => this.setState({ poolSnippet: record.pools_yaml_snippet })}>View YAML</Button>
            {' '}
            <Popconfirm title="Delete?" onConfirm={() => this.handleDeletePool(record.id)}>
              <Button size="small" type="danger">Delete</Button>
            </Popconfirm>
          </span>
        ),
      },
    ];

    return (
      <Spin spinning={monitorLoading}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>Connection:</span>
          <Select
            style={{ width: 300 }}
            value={monitorConnId}
            onChange={(v) => this.loadMonitoring(v)}
            placeholder="Select connection"
          >
            {activeConns.map((c) => (
              <Option key={c.id} value={c.id}>{c.name} ({PROVIDER_TYPES[c.provider_type]})</Option>
            ))}
          </Select>
          <Button
            style={{ marginLeft: 8 }}
            icon="plus"
            onClick={() => this.setState({
              poolVisible: true,
              poolForm: {
                connection_id: monitorConnId || '',
                pool_name: 'infoblox-pool',
                ns_hostname: '',
                nameserver_host: '',
                mdns_host: '10.0.1.70',
              },
            })}
          >
            Generate Pool Snippet
          </Button>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="Grid / Server Members" size="small" style={{ marginBottom: 16 }}>
              <Table columns={memberCols} dataSource={members} rowKey="id" size="small" pagination={false} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title={`IP Conflicts (${conflicts.length})`} size="small" style={{ marginBottom: 16 }}>
              <Table columns={conflictCols} dataSource={conflicts} rowKey="id" size="small" pagination={false} />
            </Card>
          </Col>
        </Row>

        <Card title="Pool Drafts" size="small" style={{ marginBottom: 16 }}>
          <Table columns={poolCols} dataSource={pools} rowKey="id" size="small" pagination={false} />
        </Card>

        {poolSnippet && (
          <Modal
            title="Pool YAML Snippet"
            visible={!!poolSnippet}
            onCancel={() => this.setState({ poolSnippet: null })}
            footer={[
              <Button key="copy" onClick={() => {
                navigator.clipboard.writeText(poolSnippet);
                message.success('Copied to clipboard');
              }}>Copy to Clipboard</Button>,
              <Button key="close" onClick={() => this.setState({ poolSnippet: null })}>Close</Button>,
            ]}
            width={640}
          >
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, maxHeight: 400, overflow: 'auto' }}>
              {poolSnippet}
            </pre>
          </Modal>
        )}
      </Spin>
    );
  }

  renderPoolModal() {
    const { poolVisible, poolLoading, poolForm, connections } = this.state;
    const infobloxConns = connections.filter((c) => c.provider_type === 'infoblox');
    const setField = (k, v) => this.setState((prev) => ({ poolForm: { ...prev.poolForm, [k]: v } }));
    return (
      <Modal
        title="Generate Pool Snippet"
        visible={poolVisible}
        onOk={() => this.handleGeneratePool()}
        onCancel={() => this.setState({ poolVisible: false })}
        confirmLoading={poolLoading}
      >
        <Form layout="vertical" size="small">
          <Form.Item label="Connection" required>
            <Select value={poolForm.connection_id} onChange={(v) => setField('connection_id', v)}>
              {infobloxConns.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Pool Name">
            <Input value={poolForm.pool_name} onChange={(e) => setField('pool_name', e.target.value)} />
          </Form.Item>
          <Form.Item label="NS Hostname" required>
            <Input value={poolForm.ns_hostname} onChange={(e) => setField('ns_hostname', e.target.value)} placeholder="ns1.example.com." />
          </Form.Item>
          <Form.Item label="Nameserver Host" required>
            <Input value={poolForm.nameserver_host} onChange={(e) => setField('nameserver_host', e.target.value)} placeholder="10.0.1.35" />
          </Form.Item>
          <Form.Item label="mDNS VIP">
            <Input value={poolForm.mdns_host} onChange={(e) => setField('mdns_host', e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    );
  }

  render() {
    const { activeTab } = this.state;
    return (
      <div style={{ padding: '16px 24px' }}>
        <h2 style={{ marginBottom: 16 }}>DNS & IPAM</h2>
        <Tabs activeKey={activeTab} onChange={(k) => this.setState({ activeTab: k })}>
          <TabPane tab="Connections" key="connections">
            {this.renderConnectionsTab()}
          </TabPane>
          <TabPane tab="DNS Overview" key="overview">
            {this.renderOverviewTab()}
          </TabPane>
          <TabPane tab="IPAM" key="ipam">
            {this.renderIpamTab()}
          </TabPane>
          <TabPane tab="Monitoring" key="monitoring">
            {this.renderMonitoringTab()}
          </TabPane>
        </Tabs>
        {this.renderAddConnectionModal()}
        {this.renderReserveModal()}
        {this.renderPoolModal()}
      </div>
    );
  }
}
