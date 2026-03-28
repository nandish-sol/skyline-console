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
import { observer, inject } from 'mobx-react';
import { Card, Empty, Table, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { masakariEndpoint } from 'client/client/constants';
import client from 'client';

const { Text } = Typography;

const STATUS_MAP = {
  succeeded: {
    color: 'green',
    icon: <CheckCircleOutlined />,
    label: 'Succeeded',
  },
  failed: { color: 'red', icon: <CloseCircleOutlined />, label: 'Failed' },
  running: { color: 'blue', icon: <LoadingOutlined />, label: 'Running' },
  pending: {
    color: 'default',
    icon: <ClockCircleOutlined />,
    label: 'Pending',
  },
};

function formatTime(timeStr) {
  if (!timeStr) return '-';
  try {
    return new Date(timeStr).toLocaleString();
  } catch (e) {
    return timeStr;
  }
}

const columns = [
  {
    title: t('VM Name'),
    dataIndex: 'server_name',
    key: 'server_name',
    render: (val, record) => val || record.server_id || '-',
  },
  {
    title: t('Server ID'),
    dataIndex: 'server_id',
    key: 'server_id',
    ellipsis: true,
    render: (val) =>
      val ? (
        <Text copyable={{ text: val }}>{`${val.substring(0, 8)}...`}</Text>
      ) : (
        '-'
      ),
  },
  {
    title: t('Notification'),
    dataIndex: 'notification_id',
    key: 'notification_id',
    ellipsis: true,
    render: (val) =>
      val ? (
        <Text copyable={{ text: val }}>{`${val.substring(0, 8)}...`}</Text>
      ) : (
        '-'
      ),
  },
  {
    title: t('Source Host'),
    dataIndex: 'source_host',
    key: 'source_host',
    ellipsis: true,
  },
  {
    title: t('Destination Host'),
    dataIndex: 'dest_host',
    key: 'dest_host',
    ellipsis: true,
    render: (val) => val || '-',
  },
  {
    title: t('Type'),
    dataIndex: 'type',
    key: 'type',
    render: (val) => <Tag>{val || 'evacuation'}</Tag>,
  },
  {
    title: t('Status'),
    dataIndex: 'status',
    key: 'status',
    render: (val) => {
      const item = STATUS_MAP[val] || STATUS_MAP.pending;
      return (
        <Tag color={item.color} icon={item.icon}>
          {item.label}
        </Tag>
      );
    },
  },
  {
    title: t('Start Time'),
    dataIndex: 'start_time',
    key: 'start_time',
    render: formatTime,
    sorter: (a, b) => new Date(a.start_time || 0) - new Date(b.start_time || 0),
    defaultSortOrder: 'descend',
  },
  {
    title: t('End Time'),
    dataIndex: 'end_time',
    key: 'end_time',
    render: (val) => (val ? formatTime(val) : '-'),
  },
  {
    title: t('Message'),
    dataIndex: 'message',
    key: 'message',
    ellipsis: true,
    render: (val) => (val ? <Text type="danger">{val}</Text> : '-'),
  },
];

export class VMoves extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allVmoves: [],
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fetchAllVMoves();
  }

  get endpoint() {
    return masakariEndpoint();
  }

  fetchAllVMoves = async () => {
    this.setState({ isLoading: true });
    try {
      const notifResult = await client.masakari.notifications.list({
        sort_key: 'updated_at',
        sort_dir: 'desc',
        limit: 50,
      });
      const notifications = (notifResult && notifResult.notifications) || [];

      const vmovePromises = notifications.map(async (notif) => {
        try {
          const result = await client.masakari.notifications.vmoves.list(
            notif.notification_uuid
          );
          const moves = (result && result.vmoves) || [];
          return moves.map((vm) => ({
            ...vm,
            notification_id: notif.notification_uuid,
          }));
        } catch (e) {
          return [];
        }
      });

      const vmoveArrays = await Promise.all(vmovePromises);
      const allVmoves = vmoveArrays.flat();
      this.setState({ allVmoves, isLoading: false });
    } catch (e) {
      this.setState({ allVmoves: [], isLoading: false });
    }
  };

  render() {
    const { allVmoves, isLoading } = this.state;

    return (
      <div style={{ padding: 24 }}>
        <Card
          title={
            <span>
              <SwapOutlined style={{ marginRight: 8 }} />
              {t('VM Moves')}
            </span>
          }
          extra={
            <span
              role="button"
              tabIndex={0}
              onClick={this.fetchAllVMoves}
              onKeyDown={(e) => {
                if (e.key === 'Enter') this.fetchAllVMoves();
              }}
              style={{ cursor: 'pointer', color: '#1890ff', fontSize: 16 }}
            >
              <ReloadOutlined />
            </span>
          }
        >
          {!isLoading && allVmoves.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('No VM moves found')}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={allVmoves}
              rowKey={(record) =>
                record.uuid || `${record.notification_id}-${record.server_id}`
              }
              loading={isLoading}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              size="small"
            />
          )}
        </Card>
      </div>
    );
  }
}

export default inject('rootStore')(observer(VMoves));
