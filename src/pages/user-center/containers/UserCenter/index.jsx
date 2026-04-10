import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Layout, Tag, Button } from 'antd';
import { UserOutlined, EditOutlined, CameraOutlined } from '@ant-design/icons';
import globalUserStore from 'stores/keystone/user';
import client from 'client';
import ProfileImageModal from './ProfileImageModal';
import styles from './styles.less';

export class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: {},
      profileImageSrc: null,
      imageModalVisible: false,
    };
  }

  componentDidMount() {
    this.fetchData();
    this.fetchProfileImage();
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

  fetchData = async () => {
    const {
      user: { user },
    } = this.props.rootStore;
    const detail = await globalUserStore.pureFetchDetail({ id: user.id });
    this.setState({ detail });
  };

  fetchProfileImage = async () => {
    try {
      const data = await client.skyline.profileImage();
      if (data && data.profile_image_base64) {
        const format = data.image_format || 'png';
        this.setState({
          profileImageSrc: `data:image/${format};base64,${data.profile_image_base64}`,
        });
      }
    } catch (e) {
      // silently fail -- placeholder icon will show
    }
  };

  openImageModal = () => {
    this.setState({ imageModalVisible: true });
  };

  closeImageModal = () => {
    this.setState({ imageModalVisible: false });
  };

  handleImageUploadSuccess = ({ dataUri }) => {
    this.setState({
      profileImageSrc: dataUri,
      imageModalVisible: false,
    });
  };

  renderHeader() {
    const { detail = {}, profileImageSrc } = this.state;
    const name = detail.name || '-';
    const email = detail.email || '';

    return (
      <div className={styles['header-card']}>
        <div className={styles['header-content']}>
          <div
            className={styles.avatar}
            onClick={this.openImageModal}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') this.openImageModal();
            }}
            role="button"
            tabIndex={0}
            title={t('Click to change profile image')}
          >
            {profileImageSrc ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={profileImageSrc} className={styles['avatar-img']} />
            ) : (
              <UserOutlined />
            )}
            <div className={styles['avatar-overlay']}>
              <CameraOutlined />
              <span>{t('Change')}</span>
            </div>
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
    const { imageModalVisible, profileImageSrc } = this.state;
    return (
      <Layout.Content className={styles.content}>
        {this.renderHeader()}
        {this.renderStats()}
        {this.renderInfoSection()}
        <ProfileImageModal
          visible={imageModalVisible}
          currentImageSrc={profileImageSrc}
          onCancel={this.closeImageModal}
          onSuccess={this.handleImageUploadSuccess}
        />
      </Layout.Content>
    );
  }
}

export default inject('rootStore')(observer(Overview));
