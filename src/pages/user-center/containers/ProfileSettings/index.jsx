import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import {
  Layout,
  Tabs,
  Form,
  Input,
  Button,
  message,
  Card,
  Tooltip,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  InfoCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import globalUserStore from 'stores/keystone/user';
import client from 'client';
import ProfileImageModal from '../UserCenter/ProfileImageModal';

const { TabPane } = Tabs;

const THEME_PRESETS = [
  { name: 'Xloud Green', value: '#197560' },
  { name: 'Blue', value: '#1890ff' },
  { name: 'Purple', value: '#722ed1' },
  { name: 'Orange', value: '#fa8c16' },
  { name: 'Teal', value: '#13c2c2' },
  { name: 'Magenta', value: '#eb2f96' },
  { name: 'Red', value: '#f5222d' },
  { name: 'Lime', value: '#52c41a' },
];

const styles = {
  content: {
    height: '100%',
    padding: 24,
    overflow: 'auto',
  },
  card: {
    maxWidth: 900,
  },
  formActions: {
    marginTop: 24,
  },
  avatarWrap: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#f0f0f0',
    border: '2px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity .15s',
    fontSize: 12,
    gap: 4,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    cursor: 'pointer',
    border: '2px solid transparent',
    display: 'inline-block',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  swatchSelected: {
    border: '2px solid #333',
    transform: 'scale(1.08)',
  },
};

export class ProfileSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keystoneDetail: {},
      me: null,
      loading: true,
      saving: false,
      savingPassword: false,
      imageModalVisible: false,
      selectedTheme: null,
      profileImageSrc: null,
    };
  }

  componentDidMount() {
    this.fetchAll();
  }

  get userId() {
    const {
      user: { user },
    } = this.props.rootStore;
    return user.id;
  }

  fetchAll = async () => {
    this.setState({ loading: true });
    try {
      const [detail, me, img] = await Promise.all([
        globalUserStore.pureFetchDetail({ id: this.userId }),
        client.skyline.profileMe().catch(() => null),
        client.skyline.profileImage().catch(() => null),
      ]);
      const meData = me && me.data ? me.data : me;
      const imgData = img && img.data ? img.data : img;
      let profileImageSrc = null;
      if (imgData && imgData.profile_image_base64) {
        const fmt = imgData.image_format || 'png';
        profileImageSrc = `data:image/${fmt};base64,${imgData.profile_image_base64}`;
      }
      this.setState({
        keystoneDetail: detail || {},
        me: meData || {},
        selectedTheme: (meData && meData.theme_color) || '#197560',
        profileImageSrc,
        loading: false,
      });
    } catch (e) {
      message.error(t('Failed to load profile.'));
      this.setState({ loading: false });
    }
  };

  handleProfileSubmit = async (values) => {
    this.setState({ saving: true });
    try {
      await client.skyline.profileMeUpdate(values);
      message.success(t('Profile updated successfully'));
      await this.fetchAll();
    } catch (e) {
      const detail =
        (e && e.response && e.response.data && e.response.data.detail) ||
        t('Failed to update profile');
      message.error(detail);
    }
    this.setState({ saving: false });
  };

  handleThemeSave = async () => {
    const { selectedTheme } = this.state;
    this.setState({ saving: true });
    try {
      await client.skyline.profileMeUpdate({ theme_color: selectedTheme });
      document.documentElement.style.setProperty(
        '--primary-color',
        selectedTheme
      );
      message.success(t('Theme color saved.'));
      await this.fetchAll();
    } catch (e) {
      const detail =
        (e && e.response && e.response.data && e.response.data.detail) ||
        t('Failed to save theme color');
      message.error(detail);
    }
    this.setState({ saving: false });
  };

  handlePasswordSubmit = async (values) => {
    this.setState({ savingPassword: true });
    try {
      await client.keystone.users.patch(this.userId, {
        user: {
          password: values.new_password,
          original_password: values.current_password,
        },
      });
      message.success(t('Password changed successfully'));
      this.props.rootStore.logout();
    } catch (e) {
      message.error(t('Failed to change password'));
    }
    this.setState({ savingPassword: false });
  };

  openImageModal = () => this.setState({ imageModalVisible: true });

  closeImageModal = () => this.setState({ imageModalVisible: false });

  handleImageUploadSuccess = ({ dataUri }) => {
    this.setState({ profileImageSrc: dataUri, imageModalVisible: false });
  };

  renderProfileTab() {
    const { keystoneDetail, me, saving, profileImageSrc } = this.state;
    const initial = {
      first_name: (me && me.first_name) || '',
      last_name: (me && me.last_name) || '',
      phone: (me && me.phone) || '',
      job_title: (me && me.job_title) || '',
      department: (me && me.department) || '',
    };
    return (
      <Form
        layout="vertical"
        initialValues={initial}
        onFinish={this.handleProfileSubmit}
        key={`${this.userId}-${me ? me.updated_at || '' : ''}`}
      >
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col flex="140px">
            <div
              style={styles.avatarWrap}
              onClick={this.openImageModal}
              role="button"
              tabIndex={0}
              onMouseEnter={(e) => {
                const ov = e.currentTarget.querySelector('[data-ov]');
                if (ov) ov.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                const ov = e.currentTarget.querySelector('[data-ov]');
                if (ov) ov.style.opacity = 0;
              }}
              title={t('Click to change profile image')}
            >
              {profileImageSrc ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img
                  src={profileImageSrc}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: 40, color: '#bbb' }}>?</span>
              )}
              <div style={styles.avatarOverlay} data-ov>
                <CameraOutlined style={{ fontSize: 22 }} />
                <span>{t('Change')}</span>
              </div>
            </div>
          </Col>
          <Col flex="auto">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label={t('Username')}>
                  <Tooltip
                    title={t(
                      'Username is set at account creation and cannot be changed.'
                    )}
                  >
                    <Input disabled value={keystoneDetail.name || ''} />
                  </Tooltip>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      {t('Email')}{' '}
                      <Tooltip
                        title={t(
                          'Contact your administrator to change your email address.'
                        )}
                      >
                        <InfoCircleOutlined style={{ color: '#999' }} />
                      </Tooltip>
                    </span>
                  }
                >
                  <Input disabled value={keystoneDetail.email || ''} />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('First Name')} name="first_name">
              <Input placeholder={t('Enter first name')} maxLength={64} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('Last Name')} name="last_name">
              <Input placeholder={t('Enter last name')} maxLength={64} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('Phone')} name="phone">
              <Input placeholder={t('Enter phone number')} maxLength={32} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('Job Title')} name="job_title">
              <Input placeholder={t('e.g. Cloud Engineer')} maxLength={128} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('Department')} name="department">
              <Input placeholder={t('e.g. Infrastructure')} maxLength={128} />
            </Form.Item>
          </Col>
        </Row>
        <div style={styles.formActions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Save Changes')}
          </Button>
        </div>
      </Form>
    );
  }

  renderAppearanceTab() {
    const { selectedTheme, saving } = this.state;
    return (
      <div>
        <h3 style={{ marginBottom: 12 }}>{t('Theme Color')}</h3>
        <p style={{ color: '#666', marginBottom: 16 }}>
          {t('Choose the primary color used across the Xloud dashboard.')}
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {THEME_PRESETS.map((p) => (
            <Tooltip key={p.value} title={p.name}>
              <button
                type="button"
                aria-label={p.name}
                style={{
                  ...styles.swatch,
                  background: p.value,
                  padding: 0,
                  ...(selectedTheme === p.value ? styles.swatchSelected : {}),
                }}
                onClick={() => this.setState({ selectedTheme: p.value })}
              />
            </Tooltip>
          ))}
        </div>
        <div style={styles.formActions}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={this.handleThemeSave}
            style={{ background: selectedTheme, borderColor: selectedTheme }}
          >
            {t('Save Theme')}
          </Button>
        </div>
      </div>
    );
  }

  renderPasswordTab() {
    const { savingPassword } = this.state;
    return (
      <Form layout="vertical" onFinish={this.handlePasswordSubmit}>
        <Form.Item
          label={t('Current Password')}
          name="current_password"
          rules={[
            { required: true, message: t('Please enter current password') },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={t('New Password')}
          name="new_password"
          rules={[
            { required: true, message: t('Please enter new password') },
            { min: 8, message: t('Password must be at least 8 characters') },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={t('Confirm New Password')}
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            { required: true, message: t('Please confirm new password') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('Passwords do not match')));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <div style={styles.formActions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={savingPassword}
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Change Password')}
          </Button>
        </div>
      </Form>
    );
  }

  render() {
    const { loading, imageModalVisible, profileImageSrc } = this.state;
    return (
      <Layout.Content style={styles.content}>
        <Card style={styles.card}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Tabs defaultActiveKey="profile">
              <TabPane tab={t('Profile')} key="profile">
                {this.renderProfileTab()}
              </TabPane>
              <TabPane tab={t('Appearance')} key="appearance">
                {this.renderAppearanceTab()}
              </TabPane>
              <TabPane tab={t('Security')} key="security">
                {this.renderPasswordTab()}
              </TabPane>
            </Tabs>
          )}
        </Card>
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

export default inject('rootStore')(observer(ProfileSettings));
