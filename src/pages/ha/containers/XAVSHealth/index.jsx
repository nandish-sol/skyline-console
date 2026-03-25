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

import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import {
  Card,
  Col,
  Row,
  Table,
  Tag,
  Spin,
  Button,
  Statistic,
  Switch,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import client from 'client';

export class XAVSHealth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: null,
      error: null,
      autoRefresh: false,
    };
    this.refreshTimer = null;
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  fetchData = async () => {
    this.setState({ loading: true });
    try {
      const result = await client.skyline.request.get('extension/xavs-health');
      this.setState({ data: result, loading: false, error: null });
    } catch (e) {
      this.setState({
        loading: false,
        error: e.message || 'Failed to fetch health data',
      });
    }
  };

  toggleAutoRefresh = (checked) => {
    this.setState({ autoRefresh: checked });
    if (checked) {
      this.refreshTimer = setInterval(this.fetchData, 30000);
    } else if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  };

  renderStatusTag(status) {
    if (status === 'up') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          UP
        </Tag>
      );
    }
    return (
      <Tag icon={<CloseCircleOutlined />} color="error">
        DOWN
      </Tag>
    );
  }

  renderBoolTag(value, trueText = 'Yes', falseText = 'No') {
    if (value) {
      return <Tag color="success">{trueText}</Tag>;
    }
    return <Tag color="error">{falseText}</Tag>;
  }

  renderSummary() {
    const { summary } = this.state.data;
    if (!summary) return null;

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title={t('Total Services')} value={summary.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title={t('Services UP')}
              value={summary.up}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title={t('Services DOWN')}
              value={summary.down}
              valueStyle={{ color: summary.down > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title={t('RabbitMQ')}
              value={summary.rabbitmq_up ? 'UP' : 'DOWN'}
              valueStyle={{
                color: summary.rabbitmq_up ? '#3f8600' : '#cf1322',
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title={t('MariaDB')}
              value={summary.mariadb_ready ? 'READY' : 'NOT READY'}
              valueStyle={{
                color: summary.mariadb_ready ? '#3f8600' : '#cf1322',
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title={t('Cluster Size')}
              value={summary.mariadb_cluster_size || '-'}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  renderServicesTable() {
    const { services } = this.state.data;
    const columns = [
      { title: t('Service'), dataIndex: 'service', key: 'service' },
      { title: t('Host'), dataIndex: 'host', key: 'host' },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        render: (status) => this.renderStatusTag(status),
      },
    ];
    return (
      <Card
        title={t('OpenStack Services')}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={services}
          rowKey="service"
          size="small"
          pagination={false}
        />
      </Card>
    );
  }

  renderRabbitMQ() {
    const { rabbitmq } = this.state.data;
    if (!rabbitmq) return null;

    const nodeColumns = [
      { title: t('Node'), dataIndex: 'name', key: 'name' },
      { title: t('Type'), dataIndex: 'type', key: 'type' },
      {
        title: t('Status'),
        dataIndex: 'up',
        key: 'up',
        render: (up) => this.renderBoolTag(up, 'Running', 'Down'),
      },
      { title: t('Memory'), dataIndex: 'mem_used', key: 'mem_used' },
      {
        title: t('FDs'),
        key: 'fd',
        render: (_, r) => `${r.fd_used || '-'}/${r.fd_total || '-'}`,
      },
      {
        title: t('Sockets'),
        key: 'sockets',
        render: (_, r) => `${r.sockets_used || '-'}/${r.sockets_total || '-'}`,
      },
      { title: t('Disk Free'), dataIndex: 'disk_free', key: 'disk_free' },
      { title: t('Uptime'), dataIndex: 'uptime', key: 'uptime' },
    ];

    const totals = rabbitmq.object_totals || {};
    const queueTotals = rabbitmq.queue_totals || {};
    const msgStats = rabbitmq.message_stats || {};

    return (
      <Card
        title={t('RabbitMQ Cluster')}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={6}>
            {this.renderBoolTag(
              rabbitmq.cluster_up,
              'Cluster UP',
              'Cluster DOWN'
            )}
          </Col>
          <Col span={6}>
            {rabbitmq.vhost_aliveness_ok !== null &&
              this.renderBoolTag(
                rabbitmq.vhost_aliveness_ok,
                'Vhost Alive',
                'Vhost Down'
              )}
          </Col>
          <Col span={6}>
            {rabbitmq.mgmt_version && (
              <span>
                {t('Version')}: {rabbitmq.mgmt_version}
              </span>
            )}
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={3}>
            <Statistic
              title={t('Connections')}
              value={totals.connections || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Channels')}
              value={totals.channels || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Queues')}
              value={totals.queues || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Messages')}
              value={queueTotals.messages || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Ready')}
              value={queueTotals.messages_ready || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Unacked')}
              value={queueTotals.messages_unacknowledged || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Published')}
              value={msgStats.publish || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
          <Col span={3}>
            <Statistic
              title={t('Acked')}
              value={msgStats.ack || 0}
              valueStyle={{ fontSize: 14 }}
            />
          </Col>
        </Row>
        {rabbitmq.nodes && rabbitmq.nodes.length > 0 && (
          <Table
            columns={nodeColumns}
            dataSource={rabbitmq.nodes}
            rowKey="name"
            size="small"
            pagination={false}
          />
        )}
      </Card>
    );
  }

  renderMariaDB() {
    const { mariadb } = this.state.data;
    if (!mariadb) return null;

    const nodeColumns = [
      { title: t('Node'), dataIndex: 'node', key: 'node' },
      {
        title: t('Reachable'),
        dataIndex: 'reachable',
        key: 'reachable',
        render: (v) => this.renderBoolTag(v),
      },
    ];

    return (
      <Card
        title={t('MariaDB / Galera Cluster')}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={4}>
            {this.renderBoolTag(mariadb.ready, 'READY', 'NOT READY')}
          </Col>
          <Col span={4}>
            <span>
              {t('Cluster Status')}:{' '}
              <strong>{mariadb.cluster_status || '-'}</strong>
            </span>
          </Col>
          <Col span={4}>
            <span>
              {t('Local State')}: <strong>{mariadb.local_state || '-'}</strong>
            </span>
          </Col>
          <Col span={4}>
            <span>
              {t('Connected')}:{' '}
              {mariadb.connected !== null
                ? this.renderBoolTag(mariadb.connected)
                : '-'}
            </span>
          </Col>
          <Col span={4}>
            <span>
              {t('Size')}: <strong>{mariadb.cluster_size || '-'}</strong>
            </span>
          </Col>
          <Col span={4}>
            <span>
              {t('Uptime')}: <strong>{mariadb.uptime || '-'}</strong>
            </span>
          </Col>
        </Row>
        {mariadb.provider_version && (
          <p style={{ marginBottom: 8 }}>
            {t('Provider')}: {mariadb.provider_version}
            {mariadb.node_name && ` | ${t('Node')}: ${mariadb.node_name}`}
            {mariadb.threads_connected !== null &&
              ` | ${t('Active Connections')}: ${mariadb.threads_connected}`}
          </p>
        )}
        {mariadb.nodes && mariadb.nodes.length > 0 && (
          <Table
            columns={nodeColumns}
            dataSource={mariadb.nodes}
            rowKey="node"
            size="small"
            pagination={false}
          />
        )}
      </Card>
    );
  }

  render() {
    const { loading, data, error, autoRefresh } = this.state;

    return (
      <div style={{ padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>{t('XAVS Health Monitor')}</h2>
          <div>
            <span style={{ marginRight: 8 }}>{t('Auto Refresh')}</span>
            <Switch
              checked={autoRefresh}
              onChange={this.toggleAutoRefresh}
              style={{ marginRight: 16 }}
            />
            <Button
              type="primary"
              icon={<SyncOutlined spin={loading} />}
              onClick={this.fetchData}
              loading={loading}
            >
              {t('Refresh')}
            </Button>
          </div>
        </div>

        {error && (
          <Card style={{ marginBottom: 16 }}>
            <Tag icon={<WarningOutlined />} color="warning">
              {error}
            </Tag>
          </Card>
        )}

        {loading && !data ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : data ? (
          <div>
            {this.renderSummary()}
            {this.renderServicesTable()}
            <Row gutter={16}>
              <Col span={24}>{this.renderRabbitMQ()}</Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>{this.renderMariaDB()}</Col>
            </Row>
          </div>
        ) : null}
      </div>
    );
  }
}

export default inject('rootStore')(observer(XAVSHealth));
