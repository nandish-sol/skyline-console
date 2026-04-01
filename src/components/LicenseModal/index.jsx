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
import { observer } from 'mobx-react';
import { Modal, Tag } from 'antd';
import globalLicenseStore from 'stores/skyline/license';
import styles from './index.less';

const STATUS_COLORS = {
  active: 'green',
  grace_period: 'blue',
  warning: 'orange',
  expired: 'red',
  critical: 'red',
  invalid_hardware: 'red',
  hardware_error: 'red',
  invalid_license: 'red',
};

export class LicenseModal extends Component {
  get store() {
    return globalLicenseStore;
  }

  renderRow(label, value) {
    return (
      <tr>
        <td>{label}</td>
        <td>{value}</td>
      </tr>
    );
  }

  renderStatus() {
    const { status } = this.store;
    const color = STATUS_COLORS[status] || 'default';
    const label = status
      ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Unknown';
    return <Tag color={color}>{label}</Tag>;
  }

  render() {
    const { visible, onClose } = this.props;
    const {
      serial,
      clusterId,
      licenseType,
      daysRemaining,
      startDate,
      endDate,
      maxSockets,
      vendor,
      message,
    } = this.store;

    return (
      <Modal
        title={t('License Information')}
        visible={visible}
        onCancel={onClose}
        footer={null}
        width={520}
      >
        <table className={styles['license-modal-table']}>
          <tbody>
            {this.renderRow(t('Status'), this.renderStatus())}
            {this.renderRow(t('Serial Number'), serial || '-')}
            {this.renderRow(
              t('License Type'),
              licenseType
                ? licenseType
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : '-'
            )}
            {this.renderRow(t('Days Remaining'), daysRemaining)}
            {this.renderRow(t('Valid From'), startDate || '-')}
            {this.renderRow(t('Valid Until'), endDate || '-')}
            {this.renderRow(t('Max Sockets'), maxSockets)}
            {this.renderRow(t('Cluster ID'), clusterId || '-')}
            {this.renderRow(t('Vendor'), vendor || '-')}
            {this.renderRow(t('Message'), message || '-')}
          </tbody>
        </table>
      </Modal>
    );
  }
}

export default observer(LicenseModal);
