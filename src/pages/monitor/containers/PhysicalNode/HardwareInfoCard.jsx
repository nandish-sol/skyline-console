// Copyright 2025-2026 Xloud Technologies Pvt Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Skeleton } from 'antd';
import client from 'client';
import styles from './hardwareInfoCard.less';

const formatBytes = (b) => {
  if (!b || b <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let f = Number(b);
  let i = 0;
  while (f >= 1024 && i < units.length - 1) {
    f /= 1024;
    i += 1;
  }
  return `${f.toFixed(2)} ${units[i]}`;
};

const isEmpty = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') {
    const s = v.trim();
    return (
      s === '' ||
      s === '-' ||
      s.toLowerCase() === 'n/a' ||
      s.toLowerCase() === 'unknown'
    );
  }
  if (Array.isArray(v)) return v.length === 0 || v.every(isEmpty);
  return false;
};

const Row2 = ({ label, value }) => {
  if (isEmpty(value)) return null;
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} title={String(value)}>
        {value}
      </span>
    </div>
  );
};

const CardSection = ({ title, rows }) => {
  const visibleRows = rows.filter((r) => !isEmpty(r.value));
  if (visibleRows.length === 0) return null;
  return (
    <Card
      className={styles.card}
      title={<span className={styles['card-title']}>{title}</span>}
      size="small"
      bordered
    >
      {visibleRows.map((r) => (
        <Row2 key={r.label} label={r.label} value={r.value} />
      ))}
    </Card>
  );
};

const HardwareInfoCard = ({ host }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchIt = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = host ? { host } : undefined;
        const resp = await client.skyline.xavsHardware.list(params);
        if (!cancelled) {
          setData(resp || {});
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e && e.message ? e.message : String(e));
          setLoading(false);
        }
      }
    };
    fetchIt();
    return () => {
      cancelled = true;
    };
  }, [host]);

  if (loading) {
    return (
      <Card className={styles.wrapper} bordered={false}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const hw = data.hardware || {};
  const conf = data.configuration || {};
  const sys = data.system_information || {};
  const net = data.networking || {};

  const memDisplay = hw.memory_display || formatBytes(hw.memory_bytes);

  const ipList = (net.nics || [])
    .flatMap((n) => n.ipv4 || [])
    .filter((v, i, a) => a.indexOf(v) === i);

  const hardwareRows = [
    { label: t('Manufacturer'), value: hw.manufacturer },
    { label: t('Model'), value: hw.model },
    { label: t('CPU'), value: hw.cpu },
    { label: t('Memory'), value: memDisplay },
    { label: t('Hostname'), value: net.hostname },
    { label: t('Primary IP'), value: net.primary_ipv4 },
    { label: t('Default Gateway'), value: net.default_gateway },
    { label: t('DNS Servers'), value: (net.dns_servers || []).join(', ') },
    ...(ipList.length > 1
      ? [{ label: t('All IPv4'), value: ipList.join(', ') }]
      : []),
  ];

  const configRows = [
    { label: t('OS Image'), value: conf.os_image },
    { label: t('OS Version'), value: conf.os_version },
    { label: t('Kernel'), value: conf.kernel },
    { label: t('HA State'), value: conf.ha_state },
    { label: t('Live Migration'), value: conf.live_migration },
  ];

  const sysRows = [
    { label: t('Host Time'), value: sys.host_time },
    { label: t('Asset Tag'), value: sys.asset_tag },
    { label: t('Serial Number'), value: sys.serial_number },
    { label: t('BIOS Vendor'), value: sys.bios_vendor },
    { label: t('BIOS Version'), value: sys.bios_version },
    { label: t('BIOS Release Date'), value: sys.bios_date },
    { label: t('Board Vendor'), value: sys.board_vendor },
    { label: t('Board'), value: sys.board_name },
    { label: t('Chassis Vendor'), value: sys.chassis_vendor },
    { label: t('Product Family'), value: sys.product_family },
  ];

  const allEmpty =
    hardwareRows.every((r) => isEmpty(r.value)) &&
    configRows.every((r) => isEmpty(r.value)) &&
    sysRows.every((r) => isEmpty(r.value));
  if (allEmpty) return null;

  return (
    <div className={styles.wrapper}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <CardSection title={t('Hardware')} rows={hardwareRows} />
        </Col>
        <Col xs={24} md={12}>
          <CardSection title={t('Configuration')} rows={configRows} />
          <div style={{ marginTop: 16 }}>
            <CardSection title={t('System Information')} rows={sysRows} />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default HardwareInfoCard;
