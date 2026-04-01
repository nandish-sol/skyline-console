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
import { observer, inject } from 'mobx-react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import globalLicenseStore from 'stores/skyline/license';
import LicenseModal from 'components/LicenseModal';
import styles from './index.less';

const STATUS_ICONS = {
  success: <CheckCircleOutlined />,
  info: <ClockCircleOutlined />,
  warning: <WarningOutlined />,
  expired: <StopOutlined />,
  critical: <ExclamationCircleOutlined />,
};

export class LicenseBanner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
    };
  }

  get store() {
    return globalLicenseStore;
  }

  get rootStore() {
    return this.props.rootStore;
  }

  get hasAdminRole() {
    return this.rootStore && this.rootStore.hasAdminRole;
  }

  handleDismiss = () => {
    this.store.dismissBanner();
  };

  handleShowModal = () => {
    this.setState({ modalVisible: true });
  };

  handleCloseModal = () => {
    this.setState({ modalVisible: false });
  };

  render() {
    if (!this.store.shouldShowBanner) {
      return null;
    }

    const color = this.store.bannerColor;
    const icon = STATUS_ICONS[color] || STATUS_ICONS.info;
    const { message } = this.store;
    const { modalVisible } = this.state;
    const canDismiss =
      this.store.status === 'active' || this.store.status === 'grace_period';

    return (
      <>
        <div
          className={`${styles['license-banner']} ${
            styles[`license-banner-${color}`]
          }`}
        >
          <div className={styles['license-banner-content']}>
            <span className={styles['license-banner-icon']}>{icon}</span>
            <span>{message}</span>
            {this.store.restrictedMode && (
              <span style={{ fontWeight: 600, marginLeft: 8 }}>
                {t('Restricted Mode: Create/Delete operations are disabled.')}
              </span>
            )}
          </div>
          <div className={styles['license-banner-actions']}>
            {this.hasAdminRole && (
              <button
                type="button"
                className={styles['license-banner-btn']}
                onClick={this.handleShowModal}
              >
                {t('License')}
              </button>
            )}
            {canDismiss && (
              <span
                className={styles['license-banner-dismiss']}
                onClick={this.handleDismiss}
                role="button"
                tabIndex={0}
              >
                <CloseOutlined />
              </span>
            )}
          </div>
        </div>
        {modalVisible && (
          <LicenseModal
            visible={modalVisible}
            onClose={this.handleCloseModal}
          />
        )}
      </>
    );
  }
}

export default inject('rootStore')(observer(LicenseBanner));
