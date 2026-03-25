// Copyright 2025-2026 Xloud Technologies Pvt Ltd
import React from 'react';
import { Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const WAZUH_URL = 'https://lab.xloud.tech:5601/';

const iframeStyle = {
  width: '100%',
  height: 'calc(100vh - 160px)',
  border: 'none',
};

const IFRAME_SANDBOX =
  'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

const SecurityPosture = () => (
  <div style={{ padding: '16px 24px' }}>
    <h2 style={{ marginBottom: 16 }}>{t('Security Posture')}</h2>
    <p style={{ color: '#666', marginBottom: 16 }}>
      {t('Security information and event management powered by Wazuh SIEM.')}
    </p>
    <iframe
      src={WAZUH_URL}
      title="Wazuh Security"
      style={iframeStyle}
      sandbox={IFRAME_SANDBOX}
    />
    <div style={{ marginTop: 12 }}>
      <Button
        type="link"
        icon={<LinkOutlined />}
        href={WAZUH_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Open Security Dashboard in new tab')}
      </Button>
    </div>
  </div>
);

export default SecurityPosture;
