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
import { LockOutlined } from '@ant-design/icons';
import styles from './index.less';

/**
 * Permission denied placeholder shown when RBAC blocks a cross-service
 * API call (e.g. viewing Volumes tab without Cinder access).
 */
export default function PermissionDenied({ resourceName, serviceName }) {
  const name = resourceName || t('this resource');
  const service = serviceName || '';
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <LockOutlined />
      </div>
      <div className={styles.title}>
        {t("You don't have permission to access {name}.", { name })}
      </div>
      <div className={styles.description}>
        {service
          ? t(
              'Access to the {service} service is restricted by your role. Contact your administrator to request access.',
              { service }
            )
          : t(
              'This section is restricted by your role. Contact your administrator to request access.'
            )}
      </div>
    </div>
  );
}
