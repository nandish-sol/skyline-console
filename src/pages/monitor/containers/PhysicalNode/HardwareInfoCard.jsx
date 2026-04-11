// Copyright 2025-2026 Xloud Technologies Pvt Ltd
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Skeleton, Typography } from 'antd';
import client from 'client';
import styles from './hardwareInfoCard.less';

const { Text } = Typography;

const formatBytes = (b) => {
  if (!b || b <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let f = Number(b);
  let i = 0;
  while (f >= 1024 && i < units.length - 1) {
    f /= 1024;
    i += 1;
  }
  return `${f.toFixed(2)} ${units[i]}`;
};

const Row2 = ({ label, value }) => (
  <div className={styles.row}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value} title={value || '-'}>
      {value || '-'}
    </span>
  </div>
);

const HardwareInfoCard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchIt = async () => {
      try {
        const resp = await client.skyline.xavsHardware.list();
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
  }, []);

  if (loading) {
    return (
      <Card className={styles.wrapper} bordered={false}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={styles.wrapper} bordered={false}>
        <Text type="secondary">
          {t('Could not load hardware info')}
          {error ? `: ${error}` : ''}
        </Text>
      </Card>
    );
  }

  const hw = data.hardware || {};
  const conf = data.configuration || {};
  const sys = data.system_information || {};
  const net = data.networking || {};

  const ipList =
    (net.nics || [])
      .flatMap((n) => n.ipv4 || [])
      .filter((v, i, a) => a.indexOf(v) === i) || [];

  return (
    <div className={styles.wrapper}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            className={styles.card}
            title={
              <span className={styles['card-title']}>{t('Hardware')}</span>
            }
            size="small"
            bordered
          >
            <Row2 label={t('Manufacturer')} value={hw.manufacturer} />
            <Row2 label={t('Model')} value={hw.model} />
            <Row2 label={t('CPU')} value={hw.cpu} />
            <Row2
              label={t('Memory')}
              value={hw.memory_display || formatBytes(hw.memory_bytes)}
            />
            <Row2 label={t('Hostname')} value={net.hostname} />
            <Row2 label={t('Primary IP')} value={net.primary_ipv4} />
            <Row2 label={t('Default Gateway')} value={net.default_gateway} />
            <Row2
              label={t('DNS Servers')}
              value={(net.dns_servers || []).join(', ')}
            />
            {ipList.length > 1 && (
              <Row2 label={t('All IPv4')} value={ipList.join(', ')} />
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            className={styles.card}
            title={
              <span className={styles['card-title']}>{t('Configuration')}</span>
            }
            size="small"
            bordered
          >
            <Row2 label={t('OS Image')} value={conf.os_image} />
            <Row2 label={t('OS Version')} value={conf.os_version} />
            <Row2 label={t('HA State')} value={conf.ha_state} />
            <Row2 label={t('Live Migration')} value={conf.live_migration} />
          </Card>

          <Card
            className={styles.card}
            style={{ marginTop: 16 }}
            title={
              <span className={styles['card-title']}>
                {t('System Information')}
              </span>
            }
            size="small"
            bordered
          >
            <Row2 label={t('Host Time')} value={sys.host_time} />
            <Row2 label={t('Asset Tag')} value={sys.asset_tag} />
            <Row2 label={t('Serial Number')} value={sys.serial_number} />
            <Row2 label={t('BIOS Vendor')} value={sys.bios_vendor} />
            <Row2 label={t('BIOS Version')} value={sys.bios_version} />
            <Row2 label={t('BIOS Release Date')} value={sys.bios_date} />
            <Row2 label={t('Board')} value={sys.board_name} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HardwareInfoCard;
