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
    this.state = {
      ...this.state,
      payloadVisible: false,
    };
  }

  get leftCards() {
    const cards = [this.baseInfoCard];
    if (this.detailData && this.detailData.payload) {
      cards.push(this.payloadCard);
    }
    return cards;
  }

  get rightCards() {
    return [this.cryptoInfoCard];
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

  get payloadCard() {
    const { payloadVisible } = this.state;
    const data = this.detailData;
    const payload = data.payload || '';

    const toggleVisibility = () => {
      this.setState({ payloadVisible: !payloadVisible });
      if (!payloadVisible) {
        setTimeout(() => {
          this.setState({ payloadVisible: false });
        }, 30000);
      }
    };

    const copyPayload = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(payload);
        message.success(t('Copied to clipboard'));
      }
    };

    const options = [
      {
        label: t('Payload'),
        dataIndex: 'payload',
        render: () => (
          <div>
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
              {payloadVisible ? payload : '••••••••••••••••'}
            </pre>
            <Button
              size="small"
              icon={payloadVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={toggleVisibility}
              style={{ marginRight: 8 }}
            >
              {payloadVisible ? t('Hide') : t('Reveal')}
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyPayload}>
              {t('Copy')}
            </Button>
          </div>
        ),
      },
    ];

    return {
      title: t('Secret Payload'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
