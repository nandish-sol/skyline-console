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
  Table,
  Tag,
  Spin,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Input,
  Tooltip,
} from 'antd';
import {
  SyncOutlined,
  SearchOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import client from 'client';
import ExportButton from './ExportButton';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ACTION_COLOR_MAP = {
  create: 'green',
  delete: 'red',
  update: 'blue',
  action: 'orange',
  start: 'cyan',
  stop: 'volcano',
  attach: 'geekblue',
  detach: 'purple',
  reboot: 'magenta',
  suspend: 'gold',
  resume: 'lime',
  pause: 'gold',
  unpause: 'lime',
  shelve: 'purple',
  unshelve: 'geekblue',
  migrate: 'blue',
  snapshot: 'cyan',
  lock: 'volcano',
  unlock: 'green',
  rescue: 'orange',
  authenticate: 'default',
  unknown: 'default',
};

const HTTP_STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Not Allowed',
  409: 'Conflict',
  413: 'Too Large',
  500: 'Server Error',
  502: 'Bad Gateway',
  503: 'Unavailable',
};

const STATUS_COLOR = (status) => {
  const code = parseInt(status, 10);
  if (code >= 200 && code < 300) return 'green';
  if (code >= 400 && code < 500) return 'orange';
  if (code >= 500) return 'red';
  return 'default';
};

const SERVICE_LABELS = {
  nova: 'Compute',
  cinder: 'Storage',
  neutron: 'Network',
  keystone: 'Identity',
  glance: 'Image',
  heat: 'Orchestration',
  octavia: 'Load Balancer',
  watcher: 'Optimization',
  horizon: 'Dashboard',
  barbican: 'Key Manager',
  designate: 'DNS',
  masakari: 'Instance HA',
  manilav2: 'Shared FS',
};

const SERVICE_COLOR = {
  nova: 'blue',
  cinder: 'purple',
  neutron: 'green',
  keystone: 'gold',
  glance: 'cyan',
  heat: 'volcano',
  octavia: 'geekblue',
  watcher: 'magenta',
  horizon: 'default',
  barbican: 'orange',
  designate: 'lime',
};

@inject('rootStore')
@observer
class ActivityLog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activities: [],
      total: 0,
      aggregations: {},
      loading: false,
      filters: {
        service: undefined,
        action_type: undefined,
        resource_type: undefined,
        search: undefined,
        start: undefined,
        end: undefined,
      },
      pagination: {
        current: 1,
        pageSize: 20,
      },
      serviceOptions: [],
      resourceTypeOptions: [],
      actionTypeOptions: [],
    };
  }

  componentDidMount() {
    this.fetchFilterOptions();
    this.fetchData();
  }

  fetchFilterOptions = async () => {
    try {
      const result = await client.skyline.request.get(
        'extension/activity-log/services'
      );
      this.setState({
        serviceOptions: (result && result.services) || [],
        resourceTypeOptions: (result && result.resource_types) || [],
        actionTypeOptions: (result && result.action_types) || [],
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch activity log filter options', e);
    }
  };

  fetchData = async () => {
    const { filters, pagination } = this.state;
    this.setState({ loading: true });

    const params = {};
    if (filters.service) params.service = filters.service;
    if (filters.action_type) params.action_type = filters.action_type;
    if (filters.resource_type) params.resource_type = filters.resource_type;
    if (filters.search) params.search = filters.search;
    if (filters.start) params.start = filters.start;
    if (filters.end) params.end = filters.end;
    params.limit = pagination.pageSize;
    params.offset = (pagination.current - 1) * pagination.pageSize;

    try {
      const result = await client.skyline.request.get(
        'extension/activity-log',
        params
      );
      this.setState({
        activities: (result && result.activities) || [],
        total: (result && result.total) || 0,
        aggregations: (result && result.aggregations) || {},
        loading: false,
      });
    } catch (e) {
      this.setState({ activities: [], total: 0, loading: false });
    }
  };

  handleFilterChange = (key, value) => {
    this.setState(
      (prev) => ({
        filters: { ...prev.filters, [key]: value || undefined },
        pagination: { ...prev.pagination, current: 1 },
      }),
      this.fetchData
    );
  };

  handleDateRange = (dates) => {
    if (dates && dates.length === 2) {
      this.setState(
        (prev) => ({
          filters: {
            ...prev.filters,
            start: dates[0].toISOString(),
            end: dates[1].toISOString(),
          },
          pagination: { ...prev.pagination, current: 1 },
        }),
        this.fetchData
      );
    } else {
      this.setState(
        (prev) => ({
          filters: { ...prev.filters, start: undefined, end: undefined },
          pagination: { ...prev.pagination, current: 1 },
        }),
        this.fetchData
      );
    }
  };

  handleTableChange = (pag) => {
    this.setState(
      {
        pagination: {
          current: pag.current,
          pageSize: pag.pageSize,
        },
      },
      this.fetchData
    );
  };

  clearFilters = () => {
    this.setState(
      {
        filters: {
          service: undefined,
          action_type: undefined,
          resource_type: undefined,
          search: undefined,
          start: undefined,
          end: undefined,
        },
        pagination: { current: 1, pageSize: 20 },
      },
      this.fetchData
    );
  };

  getColumns = () => [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (val) => {
        if (!val) return '-';
        const d = new Date(val);
        return d.toLocaleString('en-IN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      },
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 100,
      render: (val) => (
        <Tag color={SERVICE_COLOR[val] || 'default'}>
          {SERVICE_LABELS[val] || val || '-'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 80,
      render: (val) => (
        <Tag color={ACTION_COLOR_MAP[val] || 'default'}>{val || '-'}</Tag>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 110,
      render: (val) => val || '-',
    },
    {
      title: 'Resource ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 130,
      ellipsis: true,
      render: (val) => {
        if (!val) return '-';
        return (
          <Tooltip title={val}>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {val.substring(0, 13)}...
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Detail',
      dataIndex: 'http_url',
      key: 'http_url',
      ellipsis: true,
      render: (val, record) => {
        if (!val && !record.http_method) return '-';
        const methodColorMap = {
          DELETE: 'red',
          POST: 'green',
          PUT: 'blue',
          PATCH: 'orange',
        };
        const methodColor = methodColorMap[record.http_method] || 'default';
        return (
          <Tooltip title={val}>
            <span>
              {record.http_method && (
                <Tag color={methodColor} style={{ marginRight: 4 }}>
                  {record.http_method}
                </Tag>
              )}
              <span style={{ fontSize: 12 }}>
                {val ? val.substring(0, 50) : '-'}
              </span>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'http_status',
      key: 'http_status',
      width: 95,
      render: (val) => {
        const code = parseInt(val, 10);
        if (!code) return '-';
        const text = HTTP_STATUS_TEXT[code] || code;
        return <Tag color={STATUS_COLOR(code)}>{text}</Tag>;
      },
    },
    {
      title: 'User',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 110,
      render: (val, record) => {
        if (val) return val;
        const uid = record.user_id || '';
        if (!uid) return <span style={{ color: '#bbb' }}>-</span>;
        return (
          <Tooltip title={uid}>
            <span
              style={{ color: '#999', fontFamily: 'monospace', fontSize: 12 }}
            >
              {uid.substring(0, 8)}...
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Project',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 110,
      render: (val, record) => {
        if (val) return val;
        const pid = record.project_id || '';
        if (!pid) return <span style={{ color: '#bbb' }}>-</span>;
        return (
          <Tooltip title={pid}>
            <span
              style={{ color: '#999', fontFamily: 'monospace', fontSize: 12 }}
            >
              {pid.substring(0, 8)}...
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Source IP',
      dataIndex: 'client_ip',
      key: 'client_ip',
      width: 110,
      render: (val) => {
        if (!val) return <span style={{ color: '#bbb' }}>-</span>;
        return (
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{val}</span>
        );
      },
    },
    {
      title: 'Node',
      dataIndex: 'node',
      key: 'node',
      width: 55,
    },
    {
      title: 'Time (s)',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 70,
      render: (val) => {
        if (!val) return '-';
        const num = parseFloat(val);
        const secs = num > 100 ? num / 1000000 : num;
        return secs.toFixed(3);
      },
    },
  ];

  renderSummaryCards = () => {
    const { aggregations, total } = this.state;
    const statusBuckets = aggregations.by_status || [];
    let success = 0;
    let clientError = 0;
    let serverError = 0;
    statusBuckets.forEach((b) => {
      const code = parseInt(b.key, 10);
      if (code >= 200 && code < 300) success += b.count;
      else if (code >= 400 && code < 500) clientError += b.count;
      else if (code >= 500) serverError += b.count;
    });

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Events" value={total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Success (2xx)"
              value={success}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Client Error (4xx)"
              value={clientError}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Server Error (5xx)"
              value={serverError}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  renderFilters = () => {
    const { filters, serviceOptions, resourceTypeOptions, actionTypeOptions } =
      this.state;

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col span={4}>
            <Select
              placeholder="Service"
              allowClear
              style={{ width: '100%' }}
              value={filters.service}
              onChange={(v) => this.handleFilterChange('service', v)}
            >
              {serviceOptions.map((s) => (
                <Option key={s} value={s}>
                  {SERVICE_LABELS[s] || s}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="Action"
              allowClear
              style={{ width: '100%' }}
              value={filters.action_type}
              onChange={(v) => this.handleFilterChange('action_type', v)}
            >
              {actionTypeOptions.map((a) => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Resource Type"
              allowClear
              style={{ width: '100%' }}
              value={filters.resource_type}
              onChange={(v) => this.handleFilterChange('resource_type', v)}
            >
              {resourceTypeOptions.map((r) => (
                <Option key={r} value={r}>
                  {r}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker
              showTime
              style={{ width: '100%' }}
              onChange={this.handleDateRange}
            />
          </Col>
          <Col span={3}>
            <Input
              placeholder="Search URL/ID..."
              prefix={<SearchOutlined />}
              allowClear
              value={filters.search}
              onChange={(e) =>
                this.setState((prev) => ({
                  filters: { ...prev.filters, search: e.target.value },
                }))
              }
              onPressEnter={this.fetchData}
            />
          </Col>
          <Col
            span={5}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
            }}
          >
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={this.fetchData}
            >
              Refresh
            </Button>
            <Button icon={<ClearOutlined />} onClick={this.clearFilters}>
              Clear
            </Button>
            <ExportButton
              getCurrentRows={() => this.state.activities}
              getFilters={() => this.state.filters}
              getTotal={() => this.state.total}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  render() {
    const { activities, total, loading, pagination } = this.state;

    return (
      <div style={{ padding: '0 4px' }}>
        <h2 style={{ marginBottom: 16 }}>Activity Log</h2>
        {this.renderSummaryCards()}
        {this.renderFilters()}
        <Spin spinning={loading}>
          <Table
            columns={this.getColumns()}
            dataSource={activities}
            rowKey={(record, index) =>
              `${record.request_id || ''}-${record.timestamp || ''}-${index}`
            }
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100', '200'],
              showTotal: (tot) => `Total ${tot} events`,
            }}
            onChange={this.handleTableChange}
            size="small"
            scroll={{ x: 1500, y: 'calc(100vh - 420px)' }}
          />
        </Spin>
      </div>
    );
  }
}

export default ActivityLog;
