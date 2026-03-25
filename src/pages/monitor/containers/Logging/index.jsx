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
import { Button } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const OPENSEARCH_URL = 'https://lab.xloud.tech:5601/';

const iframeStyle = {
  width: '100%',
  height: 'calc(100vh - 200px)',
  border: 'none',
};

const IFRAME_SANDBOX =
  'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

const Logging = () => (
  <div style={{ padding: '16px 24px' }}>
    <h2 style={{ marginBottom: 16 }}>{t('Logging')}</h2>
    <iframe
      src={OPENSEARCH_URL}
      title="OpenSearch Dashboards"
      style={iframeStyle}
      sandbox={IFRAME_SANDBOX}
    />
    <div style={{ marginTop: 12 }}>
      <Button
        type="link"
        icon={<LinkOutlined />}
        href={OPENSEARCH_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('Open OpenSearch in new tab')}
      </Button>
    </div>
  </div>
);

export default Logging;
