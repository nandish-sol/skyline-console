import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';
import {
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from '@ant-design/icons';
import { Button, message, Tag } from 'antd';

export class BaseDetail extends Base {
  constructor(props) {
    super(props);
    this._showPayload = false;
  }

  get leftCards() {
    const cards = [this.baseInfoCard];
    if (!this.isAdminPage && this.detailData && this.detailData.payload) {
      cards.push(this.payloadCard);
    }
    return cards;
  }

  get rightCards() {
    const cards = [this.cryptoInfoCard];
    if (this.isAdminPage) {
      cards.push(this.adminInfoCard);
    }
    return cards;
  }

  get detailData() {
    return this.props.detail || this.store.detail || {};
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Name'),
        dataIndex: 'name',
      },
      {
        label: t('Secret Type'),
        dataIndex: 'secret_type',
        render: (value) => {
          const colors = {
            opaque: 'blue',
            symmetric: 'green',
            public: 'cyan',
            private: 'orange',
            certificate: 'purple',
            passphrase: 'gold',
          };
          return <Tag color={colors[value] || 'default'}>{value || '-'}</Tag>;
        },
      },
      {
        label: t('Status'),
        dataIndex: 'status',
        render: (value) => (
          <Tag color={value === 'ACTIVE' ? 'green' : 'red'}>{value}</Tag>
        ),
      },
      {
        label: t('Content Type'),
        dataIndex: 'content_types',
        render: (value) => {
          if (value && typeof value === 'object') {
            return value.default || JSON.stringify(value);
          }
          return value || '-';
        },
      },
      {
        label: t('Creator ID'),
        dataIndex: 'creator_id',
        copyable: true,
      },
      {
        label: t('Created'),
        dataIndex: 'created',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Updated'),
        dataIndex: 'updated',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Expiration'),
        dataIndex: 'expiration',
        valueRender: 'toLocalTime',
        render: (value) => value || t('Never'),
      },
    ];
    return {
      title: t('Secret Info'),
      options,
    };
  }

  get cryptoInfoCard() {
    const options = [
      {
        label: t('Algorithm'),
        dataIndex: 'algorithm',
        render: (value) => {
          if (
            !value ||
            (typeof value === 'object' && !Object.keys(value).length)
          ) {
            return '-';
          }
          return String(value);
        },
      },
      {
        label: t('Bit Length'),
        dataIndex: 'bit_length',
        render: (value) => value || '-',
      },
      {
        label: t('Mode'),
        dataIndex: 'mode',
        render: (value) => value || '-',
      },
      {
        label: t('Secret Reference'),
        dataIndex: 'secret_ref',
        copyable: true,
        render: (value) => value || '-',
      },
    ];

    const data = this.detailData;
    if (data.listener && data.listener.length > 0) {
      options.push({
        label: t('Used by Listeners'),
        dataIndex: 'listener',
        render: (value) =>
          (value || []).map((ls) => (
            <Tag key={ls.id} color="blue">
              {ls.name || ls.id}
            </Tag>
          )),
      });
    }

    return {
      title: t('Crypto Details'),
      options,
    };
  }

  get adminInfoCard() {
    const options = [
      {
        label: t('Creator ID'),
        dataIndex: 'creator_id',
        copyable: true,
      },
      {
        label: t('Content Type'),
        dataIndex: 'content_types',
        render: (value) => {
          if (value && typeof value === 'object') {
            return value.default || JSON.stringify(value);
          }
          return value || '-';
        },
      },
      {
        label: t('Secret Reference'),
        dataIndex: 'secret_ref',
        copyable: true,
        render: (value) => value || '-',
      },
    ];
    return {
      title: t('Admin Info'),
      options,
    };
  }

  get payloadCard() {
    const self = this;
    return {
      title: t('Secret Payload'),
      render: () => {
        const data = self.detailData;
        const payload = data.payload || '';
        const visible = self._showPayload;

        const toggleVisibility = () => {
          self._showPayload = !self._showPayload;
          self.forceUpdate();
          if (self._showPayload) {
            setTimeout(() => {
              self._showPayload = false;
              self.forceUpdate();
            }, 30000);
          }
        };

        const copyPayload = () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(payload);
            message.success(t('Copied to clipboard'));
          }
        };

        return (
          <div
            key="payload-card"
            className="detail-left-card"
            style={{ marginBottom: 24 }}
          >
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
              {t('Secret Payload')}
            </div>
            <div style={{ marginBottom: 8, color: '#999' }}>{t('Payload')}</div>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: 4,
                fontSize: 13,
                maxHeight: 200,
                overflow: 'auto',
                marginBottom: 8,
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
              }}
            >
              {visible
                ? payload
                : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
            </pre>
            <Button
              size="small"
              icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={toggleVisibility}
              style={{ marginRight: 8 }}
            >
              {visible ? t('Hide') : t('Reveal')}
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyPayload}>
              {t('Copy')}
            </Button>
          </div>
        );
      },
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
