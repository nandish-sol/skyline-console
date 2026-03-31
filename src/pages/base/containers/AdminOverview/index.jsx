// Copyright 2021 99cloud
// Copyright 2025-2026 Xloud Technologies Pvt Ltd
//
// Licensed under the Apache License, Version 2.0

import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Row, Col, Card, Statistic, Tag, Table, Progress, Spin } from 'antd';
import {
  AppstoreAddOutlined,
  UserOutlined,
  CloudServerOutlined,
  HddOutlined,
  ApiOutlined,
  GlobalOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import client from 'client';
import styles from './style.less';

export class AdminOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      projects: 0,
      users: 0,
      instances: { total: 0, active: 0, shutoff: 0, error: 0 },
      volumes: { total: 0, inUse: 0, available: 0, totalSize: 0 },
      networks: 0,
      routers: 0,
      securityGroups: 0,
      images: 0,
      computeServices: [],
      hypervisors: [],
      vcpus: { total: 0, used: 0 },
      memory: { total: 0, used: 0 },
    };
  }

  componentDidMount() {
    this.fetchAll();
  }

  fetchAll = async () => {
    try {
      const results = await Promise.allSettled([
        client.keystone.projects.list(),
        client.keystone.users.list(),
        client.nova.servers.list({ all_tenants: true }),
        client.cinder.volumes.list({ all_tenants: true }),
        client.neutron.networks.list(),
        client.neutron.routers.list(),
        client.neutron.securityGroups.list(),
        client.glance.images.list(),
        client.nova.services.list(),
        client.nova.hypervisors.listDetail(),
      ]);

      const get = (i) =>
        results[i].status === 'fulfilled' ? results[i].value : null;

      const projects = get(0);
      const users = get(1);
      const servers = get(2);
      const volumes = get(3);
      const networks = get(4);
      const routers = get(5);
      const sgs = get(6);
      const images = get(7);
      const services = get(8);
      const hyps = get(9);

      const serverList = (servers && servers.servers) || [];
      const volumeList = (volumes && volumes.volumes) || [];
      const serviceList = (services && services.services) || [];
      const hypList = (hyps && hyps.hypervisors) || [];

      let vcpuTotal = 0;
      let vcpuUsed = 0;
      let memTotal = 0;
      let memUsed = 0;
      hypList.forEach((h) => {
        vcpuTotal += h.vcpus || 0;
        vcpuUsed += h.vcpus_used || 0;
        memTotal += h.memory_mb || 0;
        memUsed += h.memory_mb_used || 0;
      });

      this.setState({
        loading: false,
        projects: projects ? (projects.projects || []).length : 0,
        users: users ? (users.users || []).length : 0,
        instances: {
          total: serverList.length,
          active: serverList.filter((s) => s.status === 'ACTIVE').length,
          shutoff: serverList.filter((s) => s.status === 'SHUTOFF').length,
          error: serverList.filter((s) => s.status === 'ERROR').length,
        },
        volumes: {
          total: volumeList.length,
          inUse: volumeList.filter((v) => v.status === 'in-use').length,
          available: volumeList.filter((v) => v.status === 'available').length,
          totalSize: volumeList.reduce((a, v) => a + (v.size || 0), 0),
        },
        networks: networks ? (networks.networks || []).length : 0,
        routers: routers ? (routers.routers || []).length : 0,
        securityGroups: sgs ? (sgs.security_groups || []).length : 0,
        images: images ? (images.images || []).length : 0,
        computeServices: serviceList,
        hypervisors: hypList,
        vcpus: { total: vcpuTotal, used: vcpuUsed },
        memory: {
          total: Math.round(memTotal / 1024),
          used: Math.round(memUsed / 1024),
        },
      });
    } catch (e) {
      this.setState({ loading: false });
    }
  };

  renderStatCard(icon, title, value, link, color) {
    return (
      <Card size="small" hoverable style={{ textAlign: 'center' }}>
        <Link to={link} style={{ color: 'inherit' }}>
          <Statistic
            title={title}
            value={value}
            prefix={React.cloneElement(icon, {
              style: { color, fontSize: 20 },
            })}
          />
        </Link>
      </Card>
    );
  }

  renderResourceGauge(title, used, total, unit) {
    const pct = total > 0 ? Math.round((used / total) * 100) : 0;
    const color = pct > 90 ? '#f5222d' : pct > 70 ? '#faad14' : '#1890ff';
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <strong>{title}</strong>
        </div>
        <Progress
          type="circle"
          percent={pct}
          width={80}
          strokeColor={color}
          format={() => `${pct}%`}
          style={{ display: 'block', margin: '0 auto' }}
        />
        <div
          style={{
            textAlign: 'center',
            marginTop: 8,
            color: '#999',
            fontSize: 12,
          }}
        >
          {used} / {total} {unit}
        </div>
      </Card>
    );
  }

  renderComputeNodes() {
    const { hypervisors, computeServices } = this.state;
    const computes = computeServices.filter((s) => s.binary === 'nova-compute');

    const columns = [
      {
        title: t('Host'),
        dataIndex: 'host',
        width: 80,
        render: (val) => <strong>{val}</strong>,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        width: 80,
        render: (val) => (
          <Tag color={val === 'enabled' ? 'green' : 'red'}>{val}</Tag>
        ),
      },
      {
        title: t('State'),
        dataIndex: 'state',
        width: 60,
        render: (val) =>
          val === 'up' ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
          ),
      },
      {
        title: t('vCPUs'),
        key: 'vcpus',
        width: 100,
        render: (_, record) => {
          const hyp = hypervisors.find(
            (h) => h.hypervisor_hostname === record.host
          );
          if (!hyp) return '-';
          const pct = Math.round((hyp.vcpus_used / hyp.vcpus) * 100);
          return (
            <span>
              {hyp.vcpus_used}/{hyp.vcpus}{' '}
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                style={{ width: 50, display: 'inline-block' }}
              />
            </span>
          );
        },
      },
      {
        title: t('Memory'),
        key: 'memory',
        width: 120,
        render: (_, record) => {
          const hyp = hypervisors.find(
            (h) => h.hypervisor_hostname === record.host
          );
          if (!hyp) return '-';
          const usedGb = Math.round(hyp.memory_mb_used / 1024);
          const totalGb = Math.round(hyp.memory_mb / 1024);
          const pct = Math.round((hyp.memory_mb_used / hyp.memory_mb) * 100);
          return (
            <span>
              {usedGb}/{totalGb} GiB{' '}
              <Progress
                percent={pct}
                size="small"
                showInfo={false}
                style={{ width: 50, display: 'inline-block' }}
              />
            </span>
          );
        },
      },
      {
        title: t('VMs'),
        key: 'vms',
        width: 50,
        render: (_, record) => {
          const hyp = hypervisors.find(
            (h) => h.hypervisor_hostname === record.host
          );
          return hyp ? hyp.running_vms : '-';
        },
      },
    ];

    return (
      <Card
        size="small"
        title={
          <span>
            <CloudServerOutlined /> {t('Compute Nodes')}
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={computes}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>
    );
  }

  renderServiceHealth() {
    const { computeServices } = this.state;
    const grouped = {};
    computeServices.forEach((s) => {
      if (!grouped[s.binary]) grouped[s.binary] = [];
      grouped[s.binary].push(s);
    });

    return (
      <Card
        size="small"
        title={
          <span>
            <ApiOutlined /> {t('Nova Services')}
          </span>
        }
      >
        {Object.entries(grouped).map(([binary, svcs]) => (
          <div key={binary} style={{ marginBottom: 8 }}>
            <strong>{binary}</strong>
            <div>
              {svcs.map((s) => (
                <Tag
                  key={s.id}
                  color={s.state === 'up' ? 'green' : 'red'}
                  style={{ marginTop: 4 }}
                >
                  {s.host}:{' '}
                  {s.state === 'up' ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </Card>
    );
  }

  renderInstanceBreakdown() {
    const { instances } = this.state;
    return (
      <Card
        size="small"
        title={
          <span>
            <CloudServerOutlined /> {t('Instances')}
          </span>
        }
      >
        <Row gutter={8}>
          <Col span={6}>
            <Statistic title={t('Total')} value={instances.total} />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('Active')}
              value={instances.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('Stopped')}
              value={instances.shutoff}
              valueStyle={{ color: '#999' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t('Error')}
              value={instances.error}
              valueStyle={{ color: instances.error > 0 ? '#f5222d' : '#999' }}
            />
          </Col>
        </Row>
      </Card>
    );
  }

  render() {
    const {
      loading,
      projects,
      users,
      instances,
      volumes,
      networks,
      routers,
      securityGroups,
      images,
      vcpus,
      memory,
    } = this.state;

    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div className={styles.container}>
        {/* Row 1: Quick stats */}
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col span={3}>
            {this.renderStatCard(
              <AppstoreAddOutlined />,
              t('Projects'),
              projects,
              '/identity/project-admin',
              '#1890ff'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <UserOutlined />,
              t('Users'),
              users,
              '/identity/user-admin',
              '#722ed1'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <CloudServerOutlined />,
              t('Instances'),
              instances.total,
              '/compute/instance-admin',
              '#13c2c2'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <HddOutlined />,
              t('Volumes'),
              volumes.total,
              '/storage/volume-admin',
              '#fa8c16'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <GlobalOutlined />,
              t('Networks'),
              networks,
              '/network/networks-admin',
              '#2f54eb'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <ApiOutlined />,
              t('Routers'),
              routers,
              '/network/router-admin',
              '#eb2f96'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <SafetyOutlined />,
              t('Security Groups'),
              securityGroups,
              '/network/security-group-admin',
              '#52c41a'
            )}
          </Col>
          <Col span={3}>
            {this.renderStatCard(
              <DatabaseOutlined />,
              t('Images'),
              images,
              '/compute/image-admin',
              '#faad14'
            )}
          </Col>
        </Row>

        {/* Row 2: Resource gauges + Instance breakdown */}
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col span={4}>
            {this.renderResourceGauge(
              t('vCPU Usage'),
              vcpus.used,
              vcpus.total,
              t('cores')
            )}
          </Col>
          <Col span={4}>
            {this.renderResourceGauge(
              t('Memory Usage'),
              memory.used,
              memory.total,
              'GiB'
            )}
          </Col>
          <Col span={4}>
            {this.renderResourceGauge(
              t('Volume Storage'),
              volumes.inUse,
              volumes.total,
              t('vols')
            )}
          </Col>
          <Col span={12}>{this.renderInstanceBreakdown()}</Col>
        </Row>

        {/* Row 3: Compute nodes + Service health */}
        <Row gutter={[12, 12]}>
          <Col span={14}>{this.renderComputeNodes()}</Col>
          <Col span={10}>{this.renderServiceHealth()}</Col>
        </Row>
      </div>
    );
  }
}

export default inject('rootStore')(observer(AdminOverview));
