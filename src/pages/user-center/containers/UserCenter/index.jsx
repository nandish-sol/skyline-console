import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Layout, Tag, Button } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import globalUserStore from 'stores/keystone/user';
import styles from './styles.less';

export class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: {},
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  get roles() {
    const { roles = [] } = this.props.rootStore;
    return roles;
  }

  get projectName() {
    const { project: { name } = {} } = this.props.rootStore;
    return name || '-';
  }

  get projectId() {
    const { project: { id } = {} } = this.props.rootStore;
    return id || '-';
  }

  async fetchData() {
    const {
      user: { user },
    } = this.props.rootStore;
    const detail = await globalUserStore.pureFetchDetail({ id: user.id });
    this.setState({ detail });
  }

  renderHeader() {
    const { detail = {} } = this.state;
    const name = detail.name || '-';
    const email = detail.email || '';

    return (
      <div className={styles['header-card']}>
        <div className={styles['header-content']}>
          <div className={styles.avatar}>
            <UserOutlined />
          </div>
          <div className={styles['header-info']}>
            <h2>{name}</h2>
            {email && <div className={styles.email}>{email}</div>}
            <div className={styles['role-tags']}>
              {this.roles.map((role) => (
                <Tag key={role.id}>{role.name}</Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderStats() {
    const { detail = {} } = this.state;
    return (
      <div className={styles['stats-row']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{this.roles.length}</div>
          <div className={styles['stat-label']}>{t('Roles')}</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>{detail.domain_id ? 1 : 0}</div>
          <div className={styles['stat-label']}>{t('Domains')}</div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-value']}>1</div>
          <div className={styles['stat-label']}>{t('Projects')}</div>
        </div>
      </div>
    );
  }

  renderInfoSection() {
    const { detail = {} } = this.state;

    return (
      <div className={styles['info-section']}>
        <div className={styles['info-card']}>
          <h3>{t('Account Details')}</h3>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Username')}</span>
            <span className={styles['info-value']}>{detail.name || '-'}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Email')}</span>
            <span className={styles['info-value']}>{detail.email || '-'}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Phone')}</span>
            <span className={styles['info-value']}>{detail.phone || '-'}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Real Name')}</span>
            <span className={styles['info-value']}>
              {detail.real_name || '-'}
            </span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('User ID')}</span>
            <span className={styles['info-value']}>{detail.id || '-'}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Current Project')}</span>
            <span className={styles['info-value']}>{this.projectName}</span>
          </div>
          <Button
            className={styles['edit-btn']}
            type="primary"
            icon={<EditOutlined />}
            href="/user/settings"
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Edit Profile')}
          </Button>
        </div>
        <div className={styles['info-card']}>
          <h3>{t('Roles & Security')}</h3>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('My Roles')}</span>
            <span className={styles['info-value']}>
              {this.roles.map((r) => r.name).join(', ') || '-'}
            </span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Domain')}</span>
            <span className={styles['info-value']}>
              {detail.domain_id || '-'}
            </span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Project ID')}</span>
            <span className={styles['info-value']}>{this.projectId}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['info-label']}>{t('Account Status')}</span>
            <span className={styles['info-value']}>
              {detail.enabled !== false ? t('Active') : t('Disabled')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Layout.Content className={styles.content}>
        {this.renderHeader()}
        {this.renderStats()}
        {this.renderInfoSection()}
      </Layout.Content>
    );
  }
}

export default inject('rootStore')(observer(Overview));
