import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Card, Row, Col, Spin, Radio } from 'antd';
import { Chart, Line, Tooltip, Axis } from 'bizcharts';
import client from 'client';

const TIME_RANGES = [
  { label: '5 Sec', value: 5, step: 1 },
  { label: '1 Min', value: 60, step: 5 },
  { label: '30 Min', value: 1800, step: 30 },
  { label: '1 Hour', value: 3600, step: 60 },
  { label: '1 Day', value: 86400, step: 900 },
  { label: '1 Month', value: 2592000, step: 86400 },
];

const CHART_CONFIG = {
  cpu: {
    title: 'CPU Usage (%)',
    color: '#1890ff',
    query: (domain, rate) =>
      `rate(libvirt_domain_info_cpu_time_seconds_total{domain="${domain}"}[${rate}]) / libvirt_domain_info_virtual_cpus{domain="${domain}"} * 100`,
    unit: '%',
    max: 100,
  },
  ram: {
    title: 'RAM Usage (%)',
    color: '#52c41a',
    query: (domain) =>
      `libvirt_domain_memory_stats_used_percent{domain="${domain}"}`,
    unit: '%',
    max: 100,
  },
  storage: {
    title: 'Disk Throughput (bytes/s)',
    color: '#722ed1',
    query: (domain, rate) =>
      `sum(rate(libvirt_domain_block_stats_read_bytes_total{domain="${domain}"}[${rate}]) + rate(libvirt_domain_block_stats_write_bytes_total{domain="${domain}"}[${rate}]))`,
    unit: 'bytes',
  },
  iops: {
    title: 'Disk IOPS',
    color: '#fa8c16',
    query: (domain, rate) =>
      `sum(rate(libvirt_domain_block_stats_read_requests_total{domain="${domain}"}[${rate}]) + rate(libvirt_domain_block_stats_write_requests_total{domain="${domain}"}[${rate}]))`,
    unit: 'ops/s',
  },
};

function getRateWindow(step) {
  if (step <= 5) return '5m';
  if (step <= 30) return '5m';
  if (step <= 60) return '5m';
  if (step <= 900) return '10m';
  return '1h';
}

function formatTime(ts, rangeSec) {
  const d = new Date(ts * 1000);
  if (rangeSec <= 60) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  if (rangeSec <= 86400) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return `${d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(i, units.length - 1);
  return `${(bytes / k ** idx).toFixed(1)} ${units[idx]}`;
}

const MetricChart = ({ title, data, color, loading, unit }) => {
  const chartData =
    data && data.length > 0
      ? data.map((d) => ({ ...d, value: Number(d.value) }))
      : [];

  return (
    <Card
      size="small"
      title={title}
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '12px 16px' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : chartData.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#999',
            padding: 40,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {t('No metrics available')}
        </div>
      ) : (
        <Chart
          height={200}
          data={chartData}
          autoFit
          padding={[20, 40, 40, 60]}
          scale={{
            value: {
              nice: true,
              min: 0,
            },
          }}
        >
          <Axis
            name="time"
            label={{
              style: { fontSize: 10 },
              autoRotate: true,
            }}
          />
          <Axis
            name="value"
            label={{
              style: { fontSize: 10 },
              formatter:
                unit === 'bytes' ? (v) => formatBytes(Number(v)) : (v) => v,
            }}
          />
          <Tooltip
            crosshairs={{ type: 'x' }}
            shared={false}
            itemTpl={
              unit === 'bytes'
                ? '<li><span style="background-color:{color};width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px;"></span>{name}: {value}</li>'
                : undefined
            }
          />
          <Line position="time*value" color={color} shape="smooth" size={2} />
        </Chart>
      )}
    </Card>
  );
};

@inject('rootStore')
@observer
class Monitoring extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rangeIndex: 3,
      metrics: {
        cpu: [],
        ram: [],
        storage: [],
        iops: [],
      },
      loading: {
        cpu: false,
        ram: false,
        storage: false,
        iops: false,
      },
    };
    this.refreshTimer = null;
    this.domainName = null;
  }

  componentDidMount() {
    this.resolveDomainThenFetch();
  }

  componentWillUnmount() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  get instanceId() {
    const { detail = {} } = this.props;
    return detail.id || '';
  }

  get currentRange() {
    return TIME_RANGES[this.state.rangeIndex];
  }

  resolveDomainThenFetch = async () => {
    try {
      const resp = await client.skyline.request.get('query', {
        query: `libvirt_domain_openstack_info{instance_id="${this.instanceId}"}`,
      });
      const results = (resp && resp.data && resp.data.result) || [];
      if (results.length > 0 && results[0].metric) {
        this.domainName = results[0].metric.domain;
      }
    } catch (e) {
      // domain resolution failed
    }
    this.fetchAllMetrics();
  };

  fetchMetric = async (key) => {
    if (!this.domainName) return;
    const { value: rangeSec, step } = this.currentRange;
    const now = Math.floor(Date.now() / 1000);
    const start = now - rangeSec;
    const rate = getRateWindow(step);
    const config = CHART_CONFIG[key];
    const query = config.query(this.domainName, rate);

    this.setState((prev) => ({
      loading: { ...prev.loading, [key]: true },
    }));

    try {
      const resp = await client.skyline.request.get('query_range', {
        query,
        start: String(start),
        end: String(now),
        step: String(step),
      });
      const series = (resp && resp.data && resp.data.result) || [];
      const data = [];
      if (series.length > 0) {
        (series[0].values || series[0].value || []).forEach(([ts, val]) => {
          let v = parseFloat(val);
          if (config.max) v = Math.min(config.max, Math.max(0, v));
          const formatted =
            config.unit === 'bytes' ? v : Math.round(v * 100) / 100;
          data.push({
            time: formatTime(ts, rangeSec),
            value: formatted,
          });
        });
      }
      this.setState((prev) => ({
        metrics: { ...prev.metrics, [key]: data },
        loading: { ...prev.loading, [key]: false },
      }));
    } catch (e) {
      this.setState((prev) => ({
        metrics: { ...prev.metrics, [key]: [] },
        loading: { ...prev.loading, [key]: false },
      }));
    }
  };

  fetchAllMetrics = () => {
    Object.keys(CHART_CONFIG).forEach((key) => {
      this.fetchMetric(key);
    });
  };

  handleRangeChange = (e) => {
    this.setState({ rangeIndex: e.target.value }, this.fetchAllMetrics);
  };

  render() {
    const { metrics, loading, rangeIndex } = this.state;
    const rangeSec = this.currentRange.value;

    return (
      <div style={{ padding: '0 4px' }}>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {t('Instance Monitoring')}
          </span>
          <Radio.Group
            value={rangeIndex}
            onChange={this.handleRangeChange}
            buttonStyle="solid"
            size="small"
          >
            {TIME_RANGES.map((r, idx) => (
              <Radio.Button key={r.label} value={idx}>
                {r.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
        <Row gutter={16}>
          <Col span={12}>
            <MetricChart
              title={CHART_CONFIG.cpu.title}
              data={metrics.cpu}
              color={CHART_CONFIG.cpu.color}
              loading={loading.cpu}
              unit={CHART_CONFIG.cpu.unit}
              rangeSec={rangeSec}
            />
          </Col>
          <Col span={12}>
            <MetricChart
              title={CHART_CONFIG.ram.title}
              data={metrics.ram}
              color={CHART_CONFIG.ram.color}
              loading={loading.ram}
              unit={CHART_CONFIG.ram.unit}
              rangeSec={rangeSec}
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <MetricChart
              title={CHART_CONFIG.storage.title}
              data={metrics.storage}
              color={CHART_CONFIG.storage.color}
              loading={loading.storage}
              unit={CHART_CONFIG.storage.unit}
              rangeSec={rangeSec}
            />
          </Col>
          <Col span={12}>
            <MetricChart
              title={CHART_CONFIG.iops.title}
              data={metrics.iops}
              color={CHART_CONFIG.iops.color}
              loading={loading.iops}
              unit={CHART_CONFIG.iops.unit}
              rangeSec={rangeSec}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

export default Monitoring;
