import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Row, Layout, Col, Avatar, Tag, Button, Divider } from 'antd';
import { UserOutlined, MailOutlined, ArrowLeftOutlined, PhoneOutlined, IdcardOutlined, SafetyCertificateOutlined, ClusterOutlined, SettingOutlined } from '@ant-design/icons';
import globalUserStore from 'stores/keystone/user';
import ProfileIcon from 'asset/image/profile.svg';

export class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = { detail: {} };
  }

  componentDidMount() { this.fetchData(); }

  async fetchData() {
    const { user: { user } } = this.props.rootStore;
    const detail = await globalUserStore.pureFetchDetail({ id: user.id });
    this.setState({ detail });
  }

  render() {
    const { detail = {} } = this.state;
    const { user } = this.props.rootStore;
    const roles = (user && user.roles) || [];
    const project = (user && user.project) || {};
    const domain = detail.domain_id || 'Default';

    const cardStyle = {
      background: '#fff', borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: 32, marginBottom: 20,
    };
    const headerBg = {
      background: 'linear-gradient(135deg, #0f4c3a 0%, #197560 50%, #2a9d8f 100%)',
      borderRadius: '12px 12px 0 0', padding: '40px 32px',
      position: 'relative', overflow: 'hidden',
    };
    const infoRow = {
      display: 'flex', alignItems: 'center', padding: '14px 0',
      borderBottom: '1px solid #f5f5f5', fontSize: 14,
    };
    const infoLabel = {
      color: '#888', width: 140, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 8,
    };
    const infoValue = { color: '#333', fontWeight: 500, flex: 1 };
    const statBox = { textAlign: 'center', padding: '16px 0' };
    const statNum = { fontSize: 28, fontWeight: 700, color: '#197560', lineHeight: 1 };
    const statLabel = { fontSize: 12, color: '#999', marginTop: 6 };

    return (
      <Layout.Content style={{ padding: 24, overflow: 'auto', height: '100%' }}>
        <div style={{ marginBottom: 16 }}>
            <a href="/base/overview" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 14, textDecoration: 'none' }}
               onClick={(e) => { e.preventDefault(); window.location.href = '/base/overview'; }}>
              <ArrowLeftOutlined /> Back to Dashboard
            </a>
          </div>
          <div style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 20, overflow: 'hidden' }}>
          <div style={headerBg}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Avatar size={90} src={typeof localStorage !== 'undefined' && localStorage.getItem('xloud_avatar') ? localStorage.getItem('xloud_avatar') : undefined} icon={typeof localStorage !== 'undefined' && localStorage.getItem('xloud_avatar') ? undefined : <UserOutlined />} style={{ border: '3px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)' }} />
              <div>
                <h2 style={{ color: '#fff', margin: 0, fontSize: 26, fontWeight: 600 }}>
                  {detail.name || 'Loading...'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '6px 0 0', fontSize: 14 }}>
                  {detail.email || 'No email set'}
                </p>
                <div style={{ marginTop: 10 }}>
                  {roles.map(function(r, i) {
                    return <Tag key={i} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 4, marginBottom: 4 }}>{r.name || r}</Tag>;
                  })}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', padding: '8px 32px' }}>
            <Row>
              <Col span={8} style={statBox}>
                <div style={statNum}>{roles.length}</div>
                <div style={statLabel}>Roles</div>
              </Col>
              <Col span={8} style={statBox}>
                <div style={statNum}>{project.name ? 1 : 0}</div>
                <div style={statLabel}>Projects</div>
              </Col>
              <Col span={8} style={statBox}>
                <div style={statNum}>1</div>
                <div style={statLabel}>Domains</div>
              </Col>
            </Row>
          </div>
        </div>

        <Row gutter={20}>
          <Col span={14}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <IdcardOutlined /> Account Details
              </h3>
              <div style={infoRow}>
                <span style={infoLabel}><UserOutlined /> Username</span>
                <span style={infoValue}>{detail.name || '-'}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}><MailOutlined /> Email</span>
                <span style={infoValue}>{detail.email || '-'}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}><PhoneOutlined /> Phone</span>
                <span style={infoValue}>{detail.phone || '-'}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}><UserOutlined /> Real Name</span>
                <span style={infoValue}>{detail.real_name || '-'}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}><IdcardOutlined /> User ID</span>
                <span style={{ color: '#999', fontFamily: 'monospace', fontSize: 12, flex: 1 }}>{detail.id || '-'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', fontSize: 14 }}>
                <span style={infoLabel}><ClusterOutlined /> Domain</span>
                <span style={infoValue}>{domain}</span>
              </div>
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Button type="primary" href="/user/settings" style={{ borderRadius: 6, color: '#fff' }}>
                  <SettingOutlined /> Edit Profile
                </Button>
              </div>
            </div>
          </Col>

          <Col span={10}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined /> Roles &amp; Access
              </h3>
              <div style={{ marginBottom: 20 }}>
                {roles.map(function(r, i) {
                  return <Tag key={i} color="green" style={{ marginBottom: 8, padding: '4px 12px', borderRadius: 4, fontSize: 13 }}>{r.name || r}</Tag>;
                })}
                {roles.length === 0 && <span style={{ color: '#999' }}>No roles assigned</span>}
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClusterOutlined /> Current Project
              </h3>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{project.name || '-'}</div>
                <div style={{ fontSize: 12, color: '#999', fontFamily: 'monospace', marginTop: 4 }}>{project.id || '-'}</div>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined /> Security
              </h3>
              <div style={infoRow}>
                <span style={infoLabel}>2FA Status</span>
                <span style={infoValue}>
                  <Tag color={detail.options && detail.options.multi_factor_auth_enabled ? 'green' : 'default'}>
                    {detail.options && detail.options.multi_factor_auth_enabled ? 'Enabled' : 'Disabled'}
                  </Tag>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', fontSize: 14 }}>
                <span style={infoLabel}>Account Status</span>
                <span style={infoValue}>
                  <Tag color={detail.enabled ? 'green' : 'red'}>
                    {detail.enabled ? 'Active' : 'Disabled'}
                  </Tag>
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </Layout.Content>
    );
  }
}

export default inject('rootStore')(observer(Overview));
