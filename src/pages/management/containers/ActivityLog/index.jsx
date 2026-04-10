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

import React from 'react';
import { inject, observer } from 'mobx-react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Statistic,
  Tag,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  ClearOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Base from 'containers/List';
import { ActivityLogStore } from 'stores/skyline/activity-log';
import ExportButton from './ExportButton';

const { RangePicker } = DatePicker;
const { Option } = Select;

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

const METHOD_COLOR_MAP = {
  DELETE: 'red',
  POST: 'green',
  PUT: 'blue',
  PATCH: 'orange',
};

const formatTimestamp = (val) => {
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
};

const statusColor = (code) => {
  if (code >= 200 && code < 300) return 'green';
  if (code >= 400 && code < 500) return 'orange';
  if (code >= 500) return 'red';
  return 'default';
};

const renderStatus = (val) => {
  const code = parseInt(val, 10);
  if (!code) return '-';
  return <Tag color={statusColor(code)}>{HTTP_STATUS_TEXT[code] || code}</Tag>;
};

const renderShortId = (val) => {
  if (!val) return '-';
  return (
    <Tooltip title={val}>
      <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
        {val.substring(0, 13)}...
      </span>
    </Tooltip>
  );
};

const renderDetail = (val, record) => {
  if (!val && !record.http_method) return '-';
  const color = METHOD_COLOR_MAP[record.http_method] || 'default';
  return (
    <Tooltip title={val}>
      <span>
        {record.http_method && (
          <Tag color={color} style={{ marginRight: 4 }}>
            {record.http_method}
          </Tag>
        )}
        <span style={{ fontSize: 12 }}>{val ? val.substring(0, 50) : '-'}</span>
      </span>
    </Tooltip>
  );
};

const renderUserOrProject = (val, fallbackId) => {
  if (val) return val;
  if (!fallbackId) return <span style={{ color: '#bbb' }}>-</span>;
  return (
    <Tooltip title={fallbackId}>
      <span style={{ color: '#999', fontFamily: 'monospace', fontSize: 12 }}>
        {fallbackId.substring(0, 8)}...
      </span>
    </Tooltip>
  );
};

const renderClientIp = (val) => {
  if (!val) return <span style={{ color: '#bbb' }}>-</span>;
  return <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{val}</span>;
};

const formatResponseTime = (val) => {
  if (!val) return '-';
  const num = parseFloat(val);
  // Values > 100 are assumed to be microseconds from the API.
  const secs = num > 100 ? num / 1000000 : num;
  return secs.toFixed(3);
};

const computeStatusBuckets = (aggregations) => {
  const buckets = (aggregations && aggregations.by_status) || [];
  let success = 0;
  let clientError = 0;
  let serverError = 0;
  buckets.forEach((b) => {
    const code = parseInt(b.key, 10);
    const count = Number(b.count) || 0;
    if (code >= 200 && code < 300) success += count;
    else if (code >= 400 && code < 500) clientError += count;
    else if (code >= 500) serverError += count;
  });
  return { success, clientError, serverError };
};

const SummaryCards = observer(({ store }) => {
  const { success, clientError, serverError } = computeStatusBuckets(
    store.aggregations
  );
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic title={t('Total Events')} value={store.summaryTotal} />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title={t('Success (2xx)')}
            value={success}
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title={t('Client Error (4xx)')}
            value={clientError}
            valueStyle={{ color: '#faad14' }}
            prefix={<WarningOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title={t('Server Error (5xx)')}
            value={serverError}
            valueStyle={{ color: '#cf1322' }}
            prefix={<CloseCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
});

const FilterBar = observer(({ store, onFetch }) => {
  const { services, action_types, resource_types } = store.filterOptions;
  const filters = (store.list && store.list.filters) || {};

  const setFilter = (key, value) => {
    const current = { ...(store.list.filters || {}) };
    if (value === undefined || value === null || value === '') {
      delete current[key];
    } else {
      current[key] = value;
    }
    store.list.filters = current;
    onFetch();
  };

  const handleRange = (dates) => {
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      store.setDateRange(dates[0].toISOString(), dates[1].toISOString());
    } else {
      store.setDateRange(undefined, undefined);
    }
    onFetch();
  };

  const clearAll = () => {
    store.list.filters = {};
    store.setDateRange(undefined, undefined);
    onFetch();
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} align="middle">
        <Col span={4}>
          <Select
            placeholder={t('Service')}
            allowClear
            style={{ width: '100%' }}
            value={filters.service}
            onChange={(v) => setFilter('service', v)}
          >
            {(services || []).map((s) => (
              <Option key={s} value={s}>
                {SERVICE_LABELS[s] || s}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={3}>
          <Select
            placeholder={t('Action')}
            allowClear
            style={{ width: '100%' }}
            value={filters.action_type}
            onChange={(v) => setFilter('action_type', v)}
          >
            {(action_types || []).map((a) => (
              <Option key={a} value={a}>
                {a}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder={t('Resource Type')}
            allowClear
            style={{ width: '100%' }}
            value={filters.resource_type}
            onChange={(v) => setFilter('resource_type', v)}
          >
            {(resource_types || []).map((r) => (
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
            onChange={handleRange}
          />
        </Col>
        <Col span={4}>
          <Input
            placeholder={t('Search URL / ID')}
            prefix={<SearchOutlined />}
            allowClear
            value={filters.search || ''}
            onChange={(e) => setFilter('search', e.target.value || undefined)}
            onPressEnter={onFetch}
          />
        </Col>
        <Col
          span={4}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
          }}
        >
          <Button icon={<ClearOutlined />} onClick={clearAll}>
            {t('Clear')}
          </Button>
          <ExportButton
            getCurrentRows={() => (store.list && store.list.data) || []}
            getFilters={() => ({
              ...((store.list && store.list.filters) || {}),
              start: store.dateRange.start,
              end: store.dateRange.end,
            })}
            getTotal={() => store.summaryTotal}
          />
        </Col>
      </Row>
    </Card>
  );
});

@inject('rootStore')
@observer
export default class ActivityLog extends Base {
  init() {
    this.store = new ActivityLogStore();
    this.store.fetchFilterOptions();
  }

  get name() {
    return t('Activity Log');
  }

  get policy() {
    return '';
  }

  get rowKey() {
    return 'id';
  }

  get isFilterByBackend() {
    return true;
  }

  get hideDownload() {
    return true;
  }

  get hideSearch() {
    return true;
  }

  get fetchDataByAllProjects() {
    return false;
  }

  // renderHeader adds 2 rows of content above the table:
  //   Summary cards (4 Statistic cards)   ~116px + margin 16
  //   FilterBar card (single row, controls)  ~70px + margin 16
  // Total: ~218px extra. Add to Base's tableTopHeight so getTableHeight()
  // allocates the right scroll area and the page does not overflow viewport.
  get tableTopHeight() {
    return super.tableTopHeight + 218;
  }

  get searchFilters() {
    return [];
  }

  updateFetchParamsByPage = (params) => params;

  renderHeader() {
    return (
      <>
        <SummaryCards store={this.store} />
        <FilterBar
          store={this.store}
          onFetch={() => this.handleRefresh(true)}
        />
      </>
    );
  }

  getColumns() {
    return [
      {
        title: t('Time'),
        dataIndex: 'timestamp',
        width: 160,
        render: formatTimestamp,
        stringify: (val) => formatTimestamp(val),
      },
      {
        title: t('Service'),
        dataIndex: 'service',
        width: 100,
        render: (v) => (
          <Tag color={SERVICE_COLOR[v] || 'default'}>
            {SERVICE_LABELS[v] || v || '-'}
          </Tag>
        ),
        stringify: (v) => SERVICE_LABELS[v] || v || '',
      },
      {
        title: t('Action'),
        dataIndex: 'action_type',
        width: 90,
        render: (v) => (
          <Tag color={ACTION_COLOR_MAP[v] || 'default'}>{v || '-'}</Tag>
        ),
      },
      {
        title: t('Resource'),
        dataIndex: 'resource_type',
        width: 110,
        render: (v) => v || '-',
      },
      {
        title: t('Resource ID'),
        dataIndex: 'resource_id',
        width: 140,
        ellipsis: true,
        render: renderShortId,
        stringify: (v) => v || '',
      },
      {
        title: t('Detail'),
        dataIndex: 'http_url',
        ellipsis: true,
        render: renderDetail,
        stringify: (v, r) => `${(r && r.http_method) || ''} ${v || ''}`.trim(),
      },
      {
        title: t('Status'),
        dataIndex: 'http_status',
        width: 100,
        render: renderStatus,
      },
      {
        title: t('User'),
        dataIndex: 'user_name',
        width: 120,
        render: (v, r) => renderUserOrProject(v, r && r.user_id),
        stringify: (v, r) => v || (r && r.user_id) || '',
      },
      {
        title: t('Project'),
        dataIndex: 'project_name',
        width: 120,
        render: (v, r) => renderUserOrProject(v, r && r.project_id),
        stringify: (v, r) => v || (r && r.project_id) || '',
      },
      {
        title: t('Source IP'),
        dataIndex: 'client_ip',
        width: 120,
        render: renderClientIp,
      },
      {
        title: t('Node'),
        dataIndex: 'node',
        width: 70,
      },
      {
        title: t('Time (s)'),
        dataIndex: 'response_time',
        width: 90,
        render: formatResponseTime,
      },
    ];
  }
}
