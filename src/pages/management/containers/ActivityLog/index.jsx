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
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tooltip,
  Statistic,
} from 'antd';
import {
  SyncOutlined,
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import client from 'client';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ACTION_COLOR_MAP = {
  create: 'green',
  delete: 'red',
  stop: 'orange',
  start: 'blue',
  reboot: 'geekblue',
  suspend: 'volcano',
  resume: 'cyan',
  pause: 'gold',
  unpause: 'lime',
  lock: 'purple',
  unlock: 'magenta',
  shelve: 'volcano',
  unshelve: 'cyan',
  resize: 'geekblue',
  confirmResize: 'blue',
  migrate: 'purple',
  'live-migration': 'purple',
  'live-resize': 'geekblue',
  rebuild: 'orange',
  attach_volume: 'blue',
  detach_volume: 'orange',
  attach_interface: 'blue',
  detach_interface: 'orange',
  createImage: 'green',
  changePassword: 'gold',
  extend_volume: 'cyan',
  restore: 'green',
};

const ACTION_LABEL_MAP = {
  attach_interface: 'Attach Interface',
  detach_interface: 'Detach Interface',
  attach_volume: 'Attach Volume',
  detach_volume: 'Detach Volume',
  create: 'Create',
  stop: 'Stop',
  reboot: 'Reboot',
  suspend: 'Suspend',
  resume: 'Resume',
  shelve: 'Shelve',
  unshelve: 'Unshelve',
  start: 'Start',
  lock: 'Lock',
  unlock: 'Unlock',
  pause: 'Pause',
  unpause: 'Unpause',
  createImage: 'Create Snapshot',
  resize: 'Resize',
  confirmResize: 'Confirm Resize',
  'live-resize': 'Online Resize',
  extend_volume: 'Extend Volume',
  changePassword: 'Change Password',
  rebuild: 'Rebuild',
  migrate: 'Migrate',
  'live-migration': 'Live Migrate',
  delete: 'Delete',
  restore: 'Recover',
};

const STATUS_COLOR_MAP = {
  completed: 'green',
  error: 'red',
  running: 'blue',
};

const ACTION_OPTIONS = Object.keys(ACTION_LABEL_MAP).map((key) => ({
  value: key,
  label: ACTION_LABEL_MAP[key],
}));

export class ActivityLog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: [],
      error: null,
      searchText: '',
      actionFilter: undefined,
      dateRange: null,
      pagination: {
        current: 1,
        pageSize: 20,
      },
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    this.setState({ loading: true, error: null });
    try {
      const { actionFilter, dateRange } = this.state;
      const params = { limit: 500 };
      if (actionFilter) {
        params.action = actionFilter;
      }
      if (dateRange && dateRange[0]) {
        params.start = dateRange[0].toISOString();
      }
      if (dateRange && dateRange[1]) {
        params.end = dateRange[1].toISOString();
      }
      const result = await client.skyline.request.get(
        'extension/activity-log',
        params
      );
      const activities = (result && result.activities) || [];
      this.setState({ data: activities, loading: false });
    } catch (e) {
      this.setState({
        loading: false,
        error: e.message || 'Failed to fetch activity log',
      });
    }
  };

  handleSearch = (value) => {
    this.setState({
      searchText: value,
      pagination: { current: 1, pageSize: 20 },
    });
  };

  handleActionFilter = (value) => {
    this.setState({ actionFilter: value }, this.fetchData);
  };

  handleDateRange = (dates) => {
    this.setState({ dateRange: dates }, this.fetchData);
  };

  handleClearFilters = () => {
    this.setState(
      {
        searchText: '',
        actionFilter: undefined,
        dateRange: null,
        pagination: { current: 1, pageSize: 20 },
      },
      this.fetchData
    );
  };

  handleTableChange = (pagination) => {
    this.setState({ pagination });
  };

  getFilteredData = () => {
    const { data, searchText } = this.state;
    if (!searchText) return data;
    const lower = searchText.toLowerCase();
    return data.filter(
      (item) =>
        (item.instance_name || '').toLowerCase().includes(lower) ||
        (item.action || '').toLowerCase().includes(lower) ||
        (item.user_id || '').toLowerCase().includes(lower) ||
        (item.project_id || '').toLowerCase().includes(lower) ||
        (item.request_id || '').toLowerCase().includes(lower) ||
        (item.message || '').toLowerCase().includes(lower)
    );
  };

  renderActionTag(actionName) {
    const color = ACTION_COLOR_MAP[actionName] || 'default';
    const label = ACTION_LABEL_MAP[actionName] || actionName;
    return <Tag color={color}>{label}</Tag>;
  }

  renderStatusTag(status) {
    const color = STATUS_COLOR_MAP[status] || 'default';
    return <Tag color={color}>{(status || 'unknown').toUpperCase()}</Tag>;
  }

  renderSummary() {
    const { data } = this.state;
    const total = data.length;
    const actionCounts = {};
    data.forEach((item) => {
      const a = item.action || 'unknown';
      actionCounts[a] = (actionCounts[a] || 0) + 1;
    });
    const uniqueActions = Object.keys(actionCounts).length;
    const errorCount = data.filter((item) => item.status === 'error').length;

    return (
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title={t('Total Activities')} value={total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title={t('Action Types')} value={uniqueActions} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('Errors')}
              value={errorCount}
              valueStyle={{ color: errorCount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title={t('Filtered Results')}
              value={this.getFilteredData().length}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  renderFilters() {
    const { actionFilter, dateRange, searchText } = this.state;

    return (
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col span={6}>
          <Input.Search
            placeholder={t('Search activities...')}
            allowClear
            value={searchText}
            onChange={(e) => this.setState({ searchText: e.target.value })}
            onSearch={this.handleSearch}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col span={5}>
          <Select
            placeholder={t('Filter by Action')}
            allowClear
            style={{ width: '100%' }}
            value={actionFilter}
            onChange={this.handleActionFilter}
            suffixIcon={<FilterOutlined />}
          >
            {ACTION_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={7}>
          <RangePicker
            showTime
            style={{ width: '100%' }}
            value={dateRange}
            onChange={this.handleDateRange}
            placeholder={[t('Start Time'), t('End Time')]}
          />
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Tooltip title={t('Clear Filters')}>
            <Button
              icon={<ClearOutlined />}
              onClick={this.handleClearFilters}
              style={{ marginRight: 8 }}
            >
              {t('Clear')}
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={this.fetchData}
          >
            {t('Refresh')}
          </Button>
        </Col>
      </Row>
    );
  }

  renderTable() {
    const { loading, pagination } = this.state;
    const filteredData = this.getFilteredData();

    const columns = [
      {
        title: t('Timestamp'),
        dataIndex: 'start_time',
        key: 'start_time',
        width: 180,
        sorter: (a, b) =>
          (a.start_time || '').localeCompare(b.start_time || ''),
        defaultSortOrder: 'descend',
        render: (value) => {
          if (!value) return '-';
          try {
            return new Date(value).toLocaleString();
          } catch (e) {
            return value;
          }
        },
      },
      {
        title: t('Action'),
        dataIndex: 'action',
        key: 'action',
        width: 150,
        filters: ACTION_OPTIONS.map((opt) => ({
          text: opt.label,
          value: opt.value,
        })),
        onFilter: (value, record) => record.action === value,
        render: (value) => this.renderActionTag(value),
      },
      {
        title: t('Resource Name'),
        dataIndex: 'instance_name',
        key: 'instance_name',
        width: 200,
        render: (value, record) => (
          <a href={`/compute/instance/detail/${record.instance_id}`}>{value}</a>
        ),
      },
      {
        title: t('User ID'),
        dataIndex: 'user_id',
        key: 'user_id',
        width: 280,
        ellipsis: true,
        render: (value) => (
          <Tooltip title={value}>
            <span>{value}</span>
          </Tooltip>
        ),
      },
      {
        title: t('Project ID'),
        dataIndex: 'project_id',
        key: 'project_id',
        width: 280,
        ellipsis: true,
        render: (value) => (
          <Tooltip title={value}>
            <span>{value}</span>
          </Tooltip>
        ),
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        filters: [
          { text: 'Completed', value: 'completed' },
          { text: 'Error', value: 'error' },
          { text: 'Running', value: 'running' },
        ],
        onFilter: (value, record) => record.status === value,
        render: (value) => this.renderStatusTag(value),
      },
      {
        title: t('Request ID'),
        dataIndex: 'request_id',
        key: 'request_id',
        ellipsis: true,
        render: (value) => (
          <Tooltip title={value}>
            <span style={{ fontSize: 12, fontFamily: 'monospace' }}>
              {value}
            </span>
          </Tooltip>
        ),
      },
    ];

    return (
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="request_id"
          size="small"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => t('{total} activities', { total }),
          }}
          onChange={this.handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>
    );
  }

  render() {
    const { loading, data, error } = this.state;

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
          <h2 style={{ margin: 0 }}>{t('Activity Log')}</h2>
        </div>

        {error && (
          <Card style={{ marginBottom: 16 }}>
            <Tag color="warning">{error}</Tag>
          </Card>
        )}

        {loading && !data.length ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            {this.renderSummary()}
            {this.renderFilters()}
            {this.renderTable()}
          </div>
        )}
      </div>
    );
  }
}

export default inject('rootStore')(observer(ActivityLog));
