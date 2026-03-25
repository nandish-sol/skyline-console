// Copyright 2021 99cloud
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
import { Button, Col, Row, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import GlobalSearch from 'components/GlobalSearch';
import Avatar from './AvatarDropdown';
import styles from './index.less';

export class GlobalHeaderRight extends Component {
  constructor(props) {
    super(props);
    this.state = { searchVisible: false };
  }

  // eslint-disable-next-line react/sort-comp
  toggleSearch = () => {
    this.setState((prev) => ({ searchVisible: !prev.searchVisible }));
  };

  get isAdminPage() {
    const { isAdminPage = false } = this.props;
    return isAdminPage;
  }

  get isUserCenterPage() {
    const { isUserCenterPage = false } = this.props;
    return isUserCenterPage;
  }

  renderConsole() {
    if (this.isAdminPage || this.isUserCenterPage) {
      return (
        <Button
          type="link"
          href="/base/overview"
          className={styles['single-link']}
        >
          {t('Console')}
        </Button>
      );
    }
    return null;
  }

  renderAdministrator() {
    const { rootStore: { hasAdminPageRole = false } = {} } = this.props;
    if (!hasAdminPageRole || this.isAdminPage) {
      return null;
    }
    return (
      <Button
        type="link"
        href="/base/overview-admin"
        className={styles['single-link']}
      >
        {t('Administrator')}
      </Button>
    );
  }

  renderExtra() {
    return null;
  }

  renderExtraLink() {
    return null;
  }

  render() {
    const { searchVisible } = this.state;
    return (
      <div className={styles.right}>
        <Row justify="space-between" align="middle" gutter={10}>
          <Col>
            {this.renderExtraLink()}
            {this.renderConsole()}
            {this.renderAdministrator()}
          </Col>
          {this.renderExtra()}
          <Col>
            <Tooltip title={`${t('Search')} (Ctrl+K)`}>
              <SearchOutlined
                className={styles['search-icon']}
                // eslint-disable-next-line react/sort-comp
                onClick={this.toggleSearch}
                style={{
                  fontSize: 16,
                  cursor: 'pointer',
                  marginRight: 12,
                  color: '#0068ff',
                }}
              />
            </Tooltip>
          </Col>
          <Col>
            <Avatar menu />
          </Col>
        </Row>
        <GlobalSearch
          visible={searchVisible}
          onClose={() => this.setState({ searchVisible: false })}
        />
      </div>
    );
  }
}

export default inject('rootStore')(observer(GlobalHeaderRight));
