import React from 'react';
import { observer } from 'mobx-react';
import { notification } from 'antd';
import {
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import globalOperationTracker from 'stores/global/operation-tracker';

const notifiedOps = new Map();

const OperationToast = observer(() => {
  const { activeOperations } = globalOperationTracker;

  activeOperations.forEach((op) => {
    const key = `op-${op.id}`;

    if (op.status === 'running' && !notifiedOps.has(key)) {
      notification.open({
        key,
        message: op.name,
        description: op.description,
        icon: <LoadingOutlined style={{ color: '#1890ff' }} spin />,
        duration: 0,
        placement: 'topRight',
      });
      notifiedOps.set(key, true);
    } else if (op.status === 'completed' && notifiedOps.has(key)) {
      notification.open({
        key,
        message: op.name,
        description: op.result || t('Completed successfully'),
        icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
        duration: 5,
        placement: 'topRight',
      });
      notifiedOps.delete(key);
    } else if (op.status === 'failed' && notifiedOps.has(key)) {
      notification.open({
        key,
        message: op.name,
        description: op.error || t('Operation failed'),
        icon: <CloseCircleFilled style={{ color: '#f5222d' }} />,
        duration: 8,
        placement: 'topRight',
      });
      notifiedOps.delete(key);
    }
  });

  return null;
});

export default OperationToast;
