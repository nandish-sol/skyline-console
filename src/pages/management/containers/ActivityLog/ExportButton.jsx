// Copyright 2026 Xloud Technologies
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown, Menu, Modal, Progress, message } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import FileSaver from 'file-saver';
import { Parser as Json2CsvParser } from 'json2csv';
import * as XLSX from 'xlsx';
import client from 'client';

const EXPORT_FIELDS = [
  { key: 'timestamp_local', label: 'Time', width: 20 },
  { key: 'service', label: 'Service', width: 12 },
  { key: 'action_type', label: 'Action', width: 12 },
  { key: 'resource_type', label: 'Resource Type', width: 14 },
  { key: 'resource_name', label: 'Resource Name', width: 24 },
  { key: 'resource_id', label: 'Resource ID', width: 38 },
  { key: 'http_method', label: 'Method', width: 8 },
  { key: 'http_url', label: 'URL', width: 40 },
  { key: 'http_status', label: 'Status', width: 8 },
  { key: 'user_name', label: 'User', width: 16 },
  { key: 'user_id', label: 'User ID', width: 38 },
  { key: 'project_name', label: 'Project', width: 16 },
  { key: 'tenant_id', label: 'Project ID', width: 38 },
  { key: 'client_ip', label: 'Source IP', width: 16 },
  { key: 'node', label: 'Node', width: 12 },
  { key: 'request_id', label: 'Request ID', width: 40 },
  { key: 'response_time_sec', label: 'Response Time (s)', width: 12 },
  { key: 'event_type', label: 'Event Type', width: 24 },
];

const MAX_EXPORT_ROWS = 10000;
const BATCH_SIZE = 500;

function formatLocalTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function normalizeRow(raw) {
  const rt = parseFloat(raw.response_time);
  const rtSec = Number.isFinite(rt)
    ? (rt > 100 ? rt / 1000000 : rt).toFixed(3)
    : '';
  return {
    timestamp_local: formatLocalTime(raw.timestamp),
    service: raw.service || '',
    action_type: raw.action_type || '',
    resource_type: raw.resource_type || '',
    resource_name: raw.resource_name || '',
    resource_id: raw.resource_id || '',
    http_method: raw.http_method || '',
    http_url: raw.http_url || '',
    http_status: raw.http_status || '',
    user_name: raw.user_name || '',
    user_id: raw.user_id || '',
    project_name: raw.project_name || '',
    tenant_id: raw.tenant_id || raw.project_id || '',
    client_ip: raw.client_ip || '',
    node: raw.node || '',
    request_id: raw.request_id || '',
    response_time_sec: rtSec,
    event_type: raw.event_type || '',
  };
}

function buildFilename(filters, scope, ext) {
  const parts = ['activity-log'];
  if (filters.service) parts.push(filters.service);
  if (filters.action_type) parts.push(filters.action_type);
  if (filters.resource_type) parts.push(filters.resource_type);
  parts.push(scope);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  parts.push(ts);
  return `${parts.join('-')}.${ext}`;
}

function buildFilterSummary(filters, total) {
  const f = { ...filters };
  Object.keys(f).forEach((k) => {
    if (f[k] === undefined || f[k] === '') delete f[k];
  });
  return {
    exported_at: formatLocalTime(new Date().toISOString()),
    total_rows: total,
    filters: Object.keys(f).length ? f : '(none)',
  };
}

function rowsToCSV(rows) {
  const fields = EXPORT_FIELDS.map((f) => ({ label: f.label, value: f.key }));
  const parser = new Json2CsvParser({ fields });
  return `\uFEFF${parser.parse(rows)}`;
}

function rowsToJSON(rows, meta) {
  return JSON.stringify({ meta, rows }, null, 2);
}

function rowsToXLSX(rows, meta, filename) {
  const wb = XLSX.utils.book_new();

  const headerLabels = EXPORT_FIELDS.map((f) => f.label);
  const dataRows = rows.map((r) => EXPORT_FIELDS.map((f) => r[f.key]));
  const ws = XLSX.utils.aoa_to_sheet([headerLabels, ...dataRows]);
  ws['!cols'] = EXPORT_FIELDS.map((f) => ({ wch: f.width }));
  XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');

  const metaRows = [
    ['Exported At', meta.exported_at],
    ['Total Rows', meta.total_rows],
    ['', ''],
    ['Filter', 'Value'],
  ];
  if (typeof meta.filters === 'object') {
    Object.entries(meta.filters).forEach(([k, v]) =>
      metaRows.push([k, String(v)])
    );
  } else {
    metaRows.push(['(none)', '']);
  }
  const metaWs = XLSX.utils.aoa_to_sheet(metaRows);
  metaWs['!cols'] = [{ wch: 24 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, metaWs, 'Export Info');

  XLSX.writeFile(wb, filename);
}

export default class ExportButton extends Component {
  static propTypes = {
    getCurrentRows: PropTypes.func.isRequired,
    getFilters: PropTypes.func.isRequired,
    getTotal: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      downloading: false,
      progress: 0,
      fetched: 0,
      cancelled: false,
    };
  }

  fetchAllFiltered = async () => {
    const filters = this.props.getFilters();
    const total = Math.min(this.props.getTotal() || 0, MAX_EXPORT_ROWS);
    if (total === 0) return [];

    const all = [];
    let offset = 0;
    while (offset < total) {
      if (this.state.cancelled) break;
      const params = { ...filters, limit: BATCH_SIZE, offset };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === '') delete params[k];
      });
      // eslint-disable-next-line no-await-in-loop
      const result = await client.skyline.request.get(
        'extension/activity-log',
        params
      );
      const batch = (result && result.activities) || [];
      all.push(...batch);
      offset += BATCH_SIZE;
      this.setState({
        fetched: all.length,
        progress: Math.round((Math.min(all.length, total) / total) * 100),
      });
      if (batch.length < BATCH_SIZE) break;
    }
    return all;
  };

  doExport = async (format, scope) => {
    const isAll = scope === 'all';
    this.setState({
      downloading: true,
      progress: 0,
      fetched: 0,
      cancelled: false,
    });
    try {
      const rawRows = isAll
        ? await this.fetchAllFiltered()
        : this.props.getCurrentRows() || [];

      if (this.state.cancelled) {
        message.warning('Export cancelled');
        return;
      }
      if (!rawRows.length) {
        message.info('No data to export');
        return;
      }

      const rows = rawRows.map(normalizeRow);
      const filters = this.props.getFilters();
      const meta = buildFilterSummary(filters, rows.length);

      if (format === 'csv') {
        const name = buildFilename(filters, scope, 'csv');
        const blob = new Blob([rowsToCSV(rows)], {
          type: 'text/csv;charset=utf-8',
        });
        FileSaver.saveAs(blob, name);
      } else if (format === 'json') {
        const name = buildFilename(filters, scope, 'json');
        const blob = new Blob([rowsToJSON(rows, meta)], {
          type: 'application/json;charset=utf-8',
        });
        FileSaver.saveAs(blob, name);
      } else if (format === 'xlsx') {
        const name = buildFilename(filters, scope, 'xlsx');
        rowsToXLSX(rows, meta, name);
      }
      message.success(`Exported ${rows.length} rows`);
    } catch (e) {
      message.error(`Export failed: ${e.message || e}`);
    } finally {
      this.setState({ downloading: false, progress: 0, fetched: 0 });
    }
  };

  cancelExport = () => this.setState({ cancelled: true });

  render() {
    const { downloading, progress, fetched } = this.state;

    const menu = (
      <Menu
        onClick={({ key }) => {
          const [format, scope] = key.split(':');
          this.doExport(format, scope);
        }}
      >
        <Menu.ItemGroup title="Current page">
          <Menu.Item key="csv:current">CSV</Menu.Item>
          <Menu.Item key="xlsx:current">Excel (.xlsx)</Menu.Item>
          <Menu.Item key="json:current">JSON</Menu.Item>
        </Menu.ItemGroup>
        <Menu.Divider />
        <Menu.ItemGroup
          title={`All filtered (up to ${MAX_EXPORT_ROWS.toLocaleString()})`}
        >
          <Menu.Item key="csv:all">CSV</Menu.Item>
          <Menu.Item key="xlsx:all">Excel (.xlsx)</Menu.Item>
          <Menu.Item key="json:all">JSON</Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    );

    return (
      <>
        <Dropdown overlay={menu} disabled={downloading}>
          <Button icon={<DownloadOutlined />}>
            Export <DownOutlined />
          </Button>
        </Dropdown>
        <Modal
          title="Exporting activity log"
          visible={downloading}
          footer={null}
          closable={false}
          maskClosable={false}
          onCancel={this.cancelExport}
          width={420}
        >
          <Progress percent={progress} status="active" />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            Fetched {fetched.toLocaleString()} rows
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button onClick={this.cancelExport}>Cancel</Button>
          </div>
        </Modal>
      </>
    );
  }
}
