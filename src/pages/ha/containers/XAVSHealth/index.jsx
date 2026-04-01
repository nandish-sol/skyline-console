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
  Progress,
  Row,
  Table,
  Tag,
  Spin,
  Button,
  Statistic,
  Switch,
  Tooltip,
} from 'antd';
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import CircleChart from 'components/PrometheusChart/CircleWithRightLegend';
import client from 'client';

const STATUS_COLORS = {
  up: '#52c41a',
  down: '#ff4d4f',
  warn: '#faad14',
};

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

  renderSummaryCards() {
    const { summary } = this.state.data;
    if (!summary) return null;

    const upPercent =
      summary.total > 0 ? Math.round((summary.up / summary.total) * 100) : 0;

    const serviceDonutData = [
      { type: t('Healthy'), value: summary.up || 0 },
      { type: t('Down'), value: summary.down || 0 },
    ];

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* Service Health Donut */}
        <Col span={8}>
          <Card
            title={
              <span>
                <CloudServerOutlined style={{ marginRight: 8 }} />
                {t('Service Health')}
              </span>
            }
            size="small"
            bodyStyle={{ height: 200 }}
          >
            {summary.total > 0 ? (
              <CircleChart
                data={serviceDonutData}
                legendFontSize={14}
                legendOffsetX={-30}
                middleFontSize={24}
              />
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: 60,
                  color: '#999',
                }}
              >
                {t('No services detected')}
              </div>
            )}
          </Card>
        </Col>

        {/* Overall Health Progress */}
        <Col span={8}>
          <Card
            title={
              <span>
                <ApiOutlined style={{ marginRight: 8 }} />
                {t('Overall Availability')}
              </span>
            }
            size="small"
            bodyStyle={{ height: 200 }}
          >
            <div style={{ textAlign: 'center', paddingTop: 16 }}>
              <Progress
                type="dashboard"
                percent={upPercent}
                strokeColor={
                  upPercent === 100
                    ? STATUS_COLORS.up
                    : upPercent >= 80
                    ? STATUS_COLORS.warn
                    : STATUS_COLORS.down
                }
                format={(pct) => (
                  <span>
                    <div style={{ fontSize: 28, fontWeight: 600 }}>{pct}%</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {summary.up}/{summary.total}
                    </div>
                  </span>
                )}
                width={140}
              />
            </div>
          </Card>
        </Col>

        {/* Infrastructure Status */}
        <Col span={8}>
          <Card
            title={
              <span>
                <ClusterOutlined style={{ marginRight: 8 }} />
                {t('Infrastructure')}
              </span>
            }
            size="small"
            bodyStyle={{ height: 200 }}
          >
            <Row gutter={[16, 24]} style={{ paddingTop: 12 }}>
              <Col span={12}>
                <Statistic
                  title={t('RabbitMQ')}
                  value={summary.rabbitmq_up ? t('UP') : t('DOWN')}
                  valueStyle={{
                    color: summary.rabbitmq_up
                      ? STATUS_COLORS.up
                      : STATUS_COLORS.down,
                    fontSize: 20,
                  }}
                  prefix={
                    summary.rabbitmq_up ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('MariaDB')}
                  value={summary.mariadb_ready ? t('READY') : t('NOT READY')}
                  valueStyle={{
                    color: summary.mariadb_ready
                      ? STATUS_COLORS.up
                      : STATUS_COLORS.down,
                    fontSize: 20,
                  }}
                  prefix={
                    summary.mariadb_ready ? (
                      <CheckCircleOutlined />
                    ) : (
                      <CloseCircleOutlined />
                    )
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('Galera Cluster')}
                  value={summary.mariadb_cluster_size || '-'}
                  suffix={t('nodes')}
                  valueStyle={{ fontSize: 20 }}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={t('Services')}
                  value={summary.total || 0}
                  suffix={t('total')}
                  valueStyle={{ fontSize: 20 }}
                  prefix={<CloudServerOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    );
  }

  renderGaleraCard() {
    const { mariadb } = this.state.data;
    if (!mariadb) return null;
    const items = [
      {
        label: t('Cluster Status'),
        value: mariadb.cluster_status || '-',
        color: mariadb.cluster_status === 'Primary' ? '#52c41a' : '#faad14',
      },
      {
        label: t('Local State'),
        value: mariadb.local_state || '-',
        color: mariadb.local_state === 'Synced' ? '#52c41a' : '#faad14',
      },
      {
        label: t('Cluster Size'),
        value: mariadb.cluster_size ? `${mariadb.cluster_size} nodes` : '-',
      },
      { label: t('Uptime'), value: mariadb.uptime || '-' },
      { label: t('Threads'), value: mariadb.threads_connected || '-' },
      {
        label: t('Connected'),
        value: mariadb.connected ? t('Yes') : t('No'),
        color: mariadb.connected ? '#52c41a' : '#f5222d',
      },
    ];
    if (mariadb.provider_version) {
      items.push({
        label: t('Galera Version'),
        value: mariadb.provider_version,
      });
    }
    return (
      <Card
        title={
          <span>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            {t('Galera Cluster')}
            {mariadb.ready ? (
              <Tag style={{ marginLeft: 8 }} color="success">
                {t('READY')}
              </Tag>
            ) : (
              <Tag style={{ marginLeft: 8 }} color="error">
                {t('NOT READY')}
              </Tag>
            )}
          </span>
        }
        size="small"
        style={{ height: '100%' }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid #f0f0f0',
              fontSize: 14,
            }}
          >
            <span style={{ color: '#666' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: item.color || '#333' }}>
              {item.value}
            </span>
          </div>
        ))}
      </Card>
    );
  }

  renderServicesTable() {
    const { services } = this.state.data;
    if (!services || services.length === 0) return null;

    const apiServices = services.filter(
      (s) =>
        !s.service.includes('RabbitMQ AMQP') && !s.service.includes('MariaDB')
    );
    const infraServices = services.filter(
      (s) =>
        s.service.includes('RabbitMQ AMQP') || s.service.includes('MariaDB')
    );

    const columns = [
      {
        title: t('Service'),
        dataIndex: 'service',
        key: 'service',
        render: (text) => <strong>{text}</strong>,
      },
      {
        title: t('Endpoint'),
        dataIndex: 'host',
        key: 'host',
        render: (text) => (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span>
        ),
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status) =>
          status === 'up' ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              UP
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              DOWN
            </Tag>
          ),
      },
    ];

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 16, display: 'flex' }}>
        <Col span={16} style={{ display: 'flex' }}>
          <Card
            title={
              <span>
                <ApiOutlined style={{ marginRight: 8 }} />
                {t('OpenStack API Services')}
              </span>
            }
            size="small"
            style={{ flex: 1 }}
          >
            <Table
              columns={columns}
              dataSource={apiServices}
              rowKey="service"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={8} style={{ display: 'flex' }}>
          {this.renderGaleraCard()}
        </Col>
      </Row>
    );
  }

  renderRabbitMQ() {
    const { rabbitmq } = this.state.data;
    if (!rabbitmq) return null;

    const totals = rabbitmq.object_totals || {};
    const queueTotals = rabbitmq.queue_totals || {};
    const msgStats = rabbitmq.message_stats || {};
    const nodes = rabbitmq.nodes || [];

    // Donut: nodes up vs down
    const nodesUp = nodes.filter((n) => n.up).length;
    const nodesDown = nodes.filter((n) => !n.up).length;
    const nodeDonutData = [
      { type: t('Running'), value: nodesUp },
      { type: t('Down'), value: nodesDown },
    ];

    const nodeColumns = [
      {
        title: t('Node'),
        dataIndex: 'name',
        key: 'name',
        render: (name) => {
          const short = name ? name.replace('rabbit@', '') : '-';
          return (
            <Tooltip title={name}>
              <strong>{short}</strong>
            </Tooltip>
          );
        },
      },
      {
        title: t('Status'),
        dataIndex: 'up',
        key: 'up',
        width: 90,
        render: (up) =>
          up ? (
            <Tag color="success">{t('Running')}</Tag>
          ) : (
            <Tag color="error">{t('Down')}</Tag>
          ),
      },
      {
        title: t('Memory'),
        key: 'mem',
        render: (_, r) => (
          <span>
            {r.mem_used || '-'}
            {r.mem_alarm && (
              <Tag color="error" style={{ marginLeft: 4, fontSize: 10 }}>
                ALARM
              </Tag>
            )}
          </span>
        ),
      },
      {
        title: t('Disk Free'),
        key: 'disk',
        render: (_, r) => (
          <span>
            {r.disk_free || '-'}
            {r.disk_free_alarm && (
              <Tag color="error" style={{ marginLeft: 4, fontSize: 10 }}>
                ALARM
              </Tag>
            )}
          </span>
        ),
      },
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
      {
        title: t('Uptime'),
        dataIndex: 'uptime',
        key: 'uptime',
      },
    ];

    return (
      <Card
        title={
          <span>
            <ClusterOutlined style={{ marginRight: 8 }} />
            {t('RabbitMQ Cluster')}
            {rabbitmq.mgmt_version && (
              <Tag style={{ marginLeft: 8 }} color="blue">
                v{rabbitmq.mgmt_version}
              </Tag>
            )}
            {rabbitmq.vhost_aliveness_ok !== null && (
              <Tag
                style={{ marginLeft: 4 }}
                color={rabbitmq.vhost_aliveness_ok ? 'success' : 'error'}
              >
                {rabbitmq.vhost_aliveness_ok
                  ? t('Vhost Alive')
                  : t('Vhost Down')}
              </Tag>
            )}
          </span>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {/* Donut chart for nodes */}
          <Col span={6}>
            <Card
              size="small"
              title={t('Nodes')}
              bodyStyle={{ height: 160 }}
              bordered={false}
            >
              {nodes.length > 0 ? (
                <CircleChart
                  data={nodeDonutData}
                  legendFontSize={12}
                  legendOffsetX={-20}
                  middleFontSize={20}
                />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    paddingTop: 40,
                    color: '#999',
                  }}
                >
                  {t('No data')}
                </div>
              )}
            </Card>
          </Col>

          {/* Message stats */}
          <Col span={18}>
            <Row gutter={[12, 12]}>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Connections')}
                    value={totals.connections || 0}
                    valueStyle={{ fontSize: 22, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Channels')}
                    value={totals.channels || 0}
                    valueStyle={{ fontSize: 22, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Queues')}
                    value={totals.queues || 0}
                    valueStyle={{ fontSize: 22, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Exchanges')}
                    value={totals.exchanges || 0}
                    valueStyle={{ fontSize: 22, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Messages')}
                    value={queueTotals.messages || 0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Ready')}
                    value={queueTotals.messages_ready || 0}
                    valueStyle={{
                      fontSize: 18,
                      color:
                        (queueTotals.messages_ready || 0) > 1000
                          ? STATUS_COLORS.warn
                          : undefined,
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Unacked')}
                    value={queueTotals.messages_unacknowledged || 0}
                    valueStyle={{
                      fontSize: 18,
                      color:
                        (queueTotals.messages_unacknowledged || 0) > 100
                          ? STATUS_COLORS.warn
                          : undefined,
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Published')}
                    value={msgStats.publish || 0}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Node details table */}
        {nodes.length > 0 && (
          <Table
            columns={nodeColumns}
            dataSource={nodes}
            rowKey="name"
            size="small"
            pagination={false}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    );
  }

  renderMariaDB() {
    const { mariadb } = this.state.data;
    if (!mariadb) return null;

    const nodes = mariadb.nodes || [];

    // Donut: nodes reachable vs unreachable
    const reachable = nodes.filter((n) => n.reachable).length;
    const unreachable = nodes.filter((n) => !n.reachable).length;
    const nodeDonutData = [
      { type: t('Reachable'), value: reachable || 0 },
      { type: t('Unreachable'), value: unreachable || 0 },
    ];

    const nodeColumns = [
      {
        title: t('Node Address'),
        dataIndex: 'node',
        key: 'node',
        render: (addr) => (
          <span style={{ fontFamily: 'monospace' }}>{addr}</span>
        ),
      },
      {
        title: t('Reachable'),
        dataIndex: 'reachable',
        key: 'reachable',
        width: 100,
        render: (v) =>
          v ? (
            <Tag color="success">{t('Yes')}</Tag>
          ) : (
            <Tag color="error">{t('No')}</Tag>
          ),
      },
    ];

    return (
      <Card
        title={
          <span>
            <DatabaseOutlined style={{ marginRight: 8 }} />
            {t('MariaDB / Galera Cluster')}
            {mariadb.provider_version && (
              <Tag style={{ marginLeft: 8 }} color="blue">
                Galera {mariadb.provider_version}
              </Tag>
            )}
            {mariadb.ready ? (
              <Tag style={{ marginLeft: 4 }} color="success">
                {t('READY')}
              </Tag>
            ) : (
              <Tag style={{ marginLeft: 4 }} color="error">
                {t('NOT READY')}
              </Tag>
            )}
          </span>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {/* Donut for nodes */}
          <Col span={6}>
            <Card
              size="small"
              title={t('Cluster Nodes')}
              bodyStyle={{ height: 160 }}
              bordered={false}
            >
              {nodes.length > 0 ? (
                <CircleChart
                  data={nodeDonutData}
                  legendFontSize={12}
                  legendOffsetX={-20}
                  middleFontSize={20}
                />
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    paddingTop: 40,
                    color: '#999',
                  }}
                >
                  {mariadb.cluster_size
                    ? `${mariadb.cluster_size} ${t('nodes')}`
                    : t('No data')}
                </div>
              )}
            </Card>
          </Col>

          {/* Cluster stats */}
          <Col span={18}>
            <Row gutter={[12, 12]}>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Cluster Status')}
                    value={mariadb.cluster_status || '-'}
                    valueStyle={{
                      fontSize: 18,
                      fontWeight: 600,
                      color:
                        mariadb.cluster_status === 'Primary'
                          ? STATUS_COLORS.up
                          : STATUS_COLORS.warn,
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Local State')}
                    value={mariadb.local_state || '-'}
                    valueStyle={{
                      fontSize: 18,
                      fontWeight: 600,
                      color:
                        mariadb.local_state === 'Synced'
                          ? STATUS_COLORS.up
                          : STATUS_COLORS.warn,
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Cluster Size')}
                    value={mariadb.cluster_size || '-'}
                    suffix={t('nodes')}
                    valueStyle={{ fontSize: 18, fontWeight: 600 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Connected')}
                    value={
                      mariadb.connected !== null
                        ? mariadb.connected
                          ? t('Yes')
                          : t('No')
                        : '-'
                    }
                    valueStyle={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: mariadb.connected
                        ? STATUS_COLORS.up
                        : STATUS_COLORS.down,
                    }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Uptime')}
                    value={mariadb.uptime || '-'}
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Active Connections')}
                    value={
                      mariadb.threads_connected !== null
                        ? mariadb.threads_connected
                        : '-'
                    }
                    valueStyle={{ fontSize: 18 }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" bordered={false}>
                  <Statistic
                    title={t('Node Name')}
                    value={mariadb.node_name || '-'}
                    valueStyle={{ fontSize: 14 }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Node details table */}
        {nodes.length > 0 && (
          <Table
            columns={nodeColumns}
            dataSource={nodes}
            rowKey="node"
            size="small"
            pagination={false}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    );
  }

  render() {
    const { loading, data, error, autoRefresh } = this.state;

    return (
      <div style={{ padding: '16px 24px', height: '100%', overflow: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>{t('Cluster Health')}</h2>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8, color: '#666' }}>
              {t('Auto Refresh')}
            </span>
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
            {this.renderSummaryCards()}
            {this.renderServicesTable()}
            {this.renderRabbitMQ()}
            {this.renderMariaDB()}
          </div>
        ) : null}
      </div>
    );
  }
}

export default inject('rootStore')(observer(XAVSHealth));
