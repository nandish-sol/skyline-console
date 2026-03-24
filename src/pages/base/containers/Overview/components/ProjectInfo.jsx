import React, { Component } from 'react';
import { Card, Tag, Row, Col, Divider, Avatar } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, ClusterOutlined, IdcardOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import ProfileIcon from 'asset/image/profile.svg';

export class ProjectInfo extends Component {
  get rootStore() {
    return this.props.rootStore || {};
  }

  get currentUser() {
    const { user: { user } = {} } = this.rootStore;
    return user || {};
  }

  get roles() {
    const { roles = [] } = this.rootStore;
    return roles;
  }

  get project() {
    const { user: { project } = {} } = this.rootStore;
    return project || {};
  }

  render() {
    if (!this.currentUser.name) {
      return null;
    }

    const headerStyle = {
      background: 'linear-gradient(135deg, #0f4c3a 0%, #197560 50%, #2a9d8f 100%)',
      borderRadius: '8px 8px 0 0',
      padding: '24px',
    };

    const infoRow = {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #f5f5f5',
      fontSize: 13,
    };

    const infoLabel = {
      color: '#888',
      width: 120,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    };

    const avatarUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('xloud_avatar') : null;

    return (
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {avatarUrl
              ? <img src={avatarUrl} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} alt="avatar" />
              : <Avatar size={56} icon={<UserOutlined />} style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
            }
            <div>
              <div style={{ color: '#fff', fontSize: 20, fontWeight: 600 }}>
                {this.currentUser.name}
              </div>
              <div style={{ marginTop: 6 }}>
                {this.roles.map((r, i) => (
                  <Tag key={i} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 4, fontSize: 11, marginBottom: 2 }}>
                    {r.name}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px' }}>
          <div style={infoRow}>
            <span style={infoLabel}><UserOutlined /> {t('User Account')}</span>
            <span style={{ color: '#333', fontWeight: 500 }}>{this.currentUser.name}</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}><ClusterOutlined /> {t('Affiliated Domain')}</span>
            <span style={{ color: '#333', fontWeight: 500 }}>{this.currentUser.domain ? this.currentUser.domain.name : 'Default'}</span>
          </div>
          <div style={infoRow}>
            <span style={infoLabel}><IdcardOutlined /> {t('Current Project')}</span>
            <span style={{ color: '#333', fontWeight: 500 }}>{this.project.name || '-'}</span>
          </div>
          <div style={{ ...infoRow, borderBottom: 'none' }}>
            <span style={infoLabel}><SafetyCertificateOutlined /> {t('My Role')}</span>
            <span style={{ color: '#333', fontWeight: 500, flex: 1 }}>
              {this.roles.map((r, i) => (
                <Tag key={i} color="green" style={{ marginBottom: 2, borderRadius: 4, fontSize: 12 }}>{r.name}</Tag>
              ))}
            </span>
          </div>
        </div>
      </Card>
    );
  }
}

export default inject('rootStore')(observer(ProjectInfo));
