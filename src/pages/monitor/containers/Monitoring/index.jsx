// Copyright 2025-2026 Xloud Technologies Pvt Ltd
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

import React from 'react';
import { Tabs, Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const GRAFANA_URL = 'https://lab.xloud.tech:3200/';
const OPENSEARCH_URL = 'https://lab.xloud.tech:5601/';

const iframeStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  border: 'none',
};

const IFRAME_SANDBOX =
  'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

const IframePanel = ({ url, title }) => (
  <div>
    <iframe
      src={url}
      title={title}
      style={iframeStyle}
      sandbox={IFRAME_SANDBOX}
    />
    <div style={{ marginTop: 12 }}>
      <Button
        type="link"
        icon={<LinkOutlined />}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Open {title} in new tab', { title })}
      </Button>
    </div>
  </div>
);

const Monitoring = () => (
  <div style={{ padding: '16px 24px' }}>
    <h2 style={{ marginBottom: 16 }}>{t('Monitoring')}</h2>
    <Tabs defaultActiveKey="grafana">
      <TabPane tab={t('Grafana')} key="grafana">
        <IframePanel url={GRAFANA_URL} title="Grafana" />
      </TabPane>
      <TabPane tab={t('OpenSearch')} key="opensearch">
        <IframePanel url={OPENSEARCH_URL} title="OpenSearch" />
      </TabPane>
    </Tabs>
  </div>
);

export default Monitoring;
