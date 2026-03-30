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

const { RangePicker } = DatePicker;
const { Option } = Select;

const ACTION_COLOR_MAP = {
  create: 'green',
  delete: 'red',
  update: 'blue',
  action: 'orange',
  unknown: 'default',
};

const STATUS_COLOR = (status) => {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 400 && status < 500) return 'orange';
  if (status >= 500) return 'red';
  return 'default';
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
      // Dynamic filter options from API
      serviceOptions: [],
      resourceTypeOptions: [],
      actionTypeOptions: [],
    };
  }

  componentDidMount() {
    this.fetchFilterOptions();
    this.fetchData();
  }

  buildQueryString = (params) => {
    const parts = [];
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
      }
    });
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  };

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
      // Silently fail — filters just won't have options
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

    const qs = this.buildQueryString(params);

    try {
      const result = await client.skyline.request.get(
        `extension/activity-log${qs}`
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
        pagination: { current: 1, pageSize: 50 },
      },
      this.fetchData
    );
  };

  getColumns = () => [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (val) => {
        if (!val) return '-';
        const d = new Date(val);
        return d.toLocaleString();
      },
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 100,
      render: (val) => <Tag>{val || '-'}</Tag>,
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
      width: 120,
      render: (val) => val || '-',
    },
    {
      title: 'URL',
      dataIndex: 'http_url',
      key: 'http_url',
      ellipsis: true,
      render: (val, record) => (
        <Tooltip title={val}>
          <span>
            <Tag
              color={record.http_method === 'DELETE' ? 'red' : 'blue'}
              style={{ marginRight: 4 }}
            >
              {record.http_method}
            </Tag>
            {val ? val.substring(0, 60) : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'http_status',
      key: 'http_status',
      width: 80,
      render: (val) => <Tag color={STATUS_COLOR(val)}>{val || '-'}</Tag>,
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
      ellipsis: true,
      render: (val) => (val ? `${val.substring(0, 12)}...` : '-'),
    },
    {
      title: 'Node',
      dataIndex: 'node',
      key: 'node',
      width: 80,
    },
    {
      title: 'Time (s)',
      dataIndex: 'response_time',
      key: 'response_time',
      width: 80,
      render: (val) => (val ? `${parseFloat(val).toFixed(3)}` : '-'),
    },
  ];

  renderSummaryCards = () => {
    const { aggregations, total } = this.state;
    const statusAgg = (aggregations.by_status || []).reduce((acc, b) => {
      acc[b.key] = b.count;
      return acc;
    }, {});

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
              value={statusAgg.success || 0}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Client Error (4xx)"
              value={statusAgg.client_error || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Server Error (5xx)"
              value={statusAgg.server_error || 0}
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
                  {s}
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
          <Col span={4}>
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
          <Col span={4}>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={this.fetchData}
              style={{ marginRight: 8 }}
            >
              Refresh
            </Button>
            <Button icon={<ClearOutlined />} onClick={this.clearFilters}>
              Clear
            </Button>
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
              showTotal: (t) => `Total ${t} events`,
            }}
            onChange={this.handleTableChange}
            size="small"
            scroll={{ x: 1200, y: 'calc(100vh - 420px)' }}
          />
        </Spin>
      </div>
    );
  }
}

export default ActivityLog;
