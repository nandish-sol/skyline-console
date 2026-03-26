import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Layout, Tabs, Form, Input, Button, message, Card } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import globalUserStore from 'stores/keystone/user';
import client from 'client';

const styles = {
  content: {
    height: '100%',
    padding: 24,
    overflow: 'auto',
  },
  card: {
    maxWidth: 800,
  },
  formActions: {
    marginTop: 24,
  },
};

export class ProfileSettings extends Component {
  constructor(props) {
    super(props);
    this.state = {
      detail: {},
      loading: false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  get userId() {
    const {
      user: { user },
    } = this.props.rootStore;
    return user.id;
  }

  handleProfileSubmit = async (values) => {
    this.setState({ loading: true });
    try {
      await client.keystone.users.patch(this.userId, {
        user: values,
      });
      message.success(t('Profile updated successfully'));
      this.fetchData();
    } catch (e) {
      message.error(t('Failed to update profile'));
    }
    this.setState({ loading: false });
  };

  handlePasswordSubmit = async (values) => {
    this.setState({ loading: true });
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
    this.setState({ loading: false });
  };

  async fetchData() {
    const {
      user: { user },
    } = this.props.rootStore;
    const detail = await globalUserStore.pureFetchDetail({ id: user.id });
    this.setState({ detail });
  }

  renderProfileTab() {
    const { detail } = this.state;
    return (
      <Form
        layout="vertical"
        initialValues={{
          email: detail.email || '',
          description: detail.description || '',
        }}
        onFinish={this.handleProfileSubmit}
        key={detail.id}
      >
        <Form.Item label={t('Username')}>
          <Input disabled value={detail.name} />
        </Form.Item>
        <Form.Item label={t('Email')} name="email">
          <Input placeholder={t('Enter email')} />
        </Form.Item>
        <Form.Item label={t('Description')} name="description">
          <Input.TextArea rows={3} placeholder={t('Enter description')} />
        </Form.Item>
        <div style={styles.formActions}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={this.state.loading}
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Save Changes')}
          </Button>
        </div>
      </Form>
    );
  }

  renderPasswordTab() {
    return (
      <Form layout="vertical" onFinish={this.handlePasswordSubmit}>
        <Form.Item
          label={t('Current Password')}
          name="current_password"
          rules={[
            {
              required: true,
              message: t('Please enter current password'),
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={t('New Password')}
          name="new_password"
          rules={[
            {
              required: true,
              message: t('Please enter new password'),
            },
            {
              min: 8,
              message: t('Password must be at least 8 characters'),
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={t('Confirm New Password')}
          name="confirm_password"
          dependencies={['new_password']}
          rules={[
            {
              required: true,
              message: t('Please confirm new password'),
            },
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
            loading={this.state.loading}
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Change Password')}
          </Button>
        </div>
      </Form>
    );
  }

  render() {
    const items = [
      {
        key: 'profile',
        label: t('Profile'),
        children: this.renderProfileTab(),
      },
      {
        key: 'password',
        label: t('Password'),
        children: this.renderPasswordTab(),
      },
    ];

    return (
      <Layout.Content style={styles.content}>
        <Card style={styles.card}>
          <Tabs items={items} />
        </Card>
      </Layout.Content>
    );
  }
}

export default inject('rootStore')(observer(ProfileSettings));
