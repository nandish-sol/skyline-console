import React from 'react';
import { observer, inject } from 'mobx-react';
import {
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Row,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import globalVMoveStore from 'stores/masakari/vmoves';

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

const NOTIFICATION_STATUS_MAP = {
  new: 'blue',
  running: 'orange',
  finished: 'green',
  error: 'red',
  failed: 'red',
  ignored: 'default',
};

function formatTime(timeStr) {
  if (!timeStr) return '-';
  try {
    return new Date(timeStr).toLocaleString();
  } catch (e) {
    return timeStr;
  }
}

const vmoveColumns = [
  {
    title: t('VM Name'),
    dataIndex: 'server_name',
    key: 'server_name',
    render: (val, record) => val || record.server_id || '-',
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
    render: (val) => val || <Text type="secondary">{t('Pending')}</Text>,
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

export class RecoveryProgress extends React.Component {
  constructor(props) {
    super(props);
    this.store = globalVMoveStore;
    this.state = {
      vmoveList: [],
      isLoading: true,
    };
    this.timer = null;
  }

  componentDidMount() {
    this.fetchData();
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  get notificationId() {
    const { detail } = this.props;
    return detail && detail.notification_uuid;
  }

  get notificationStatus() {
    const { detail } = this.props;
    return detail && detail.status;
  }

  get isRunning() {
    return this.notificationStatus === 'running';
  }

  fetchData = async () => {
    if (!this.notificationId) {
      this.setState({ isLoading: false });
      return;
    }
    this.setState({ isLoading: true });
    try {
      const result = await this.store.fetchVMoves(this.notificationId);
      this.setState({ vmoveList: result || [], isLoading: false });
      if (this.isRunning && !this.timer) {
        this.timer = setInterval(() => this.fetchData(), 5000);
      }
      if (!this.isRunning) {
        this.clearTimer();
      }
    } catch (e) {
      this.setState({ vmoveList: [], isLoading: false });
    }
  };

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  renderSummary() {
    const { vmoveList } = this.state;
    const { detail } = this.props;
    const total = vmoveList.length;
    const succeeded = vmoveList.filter((v) => v.status === 'succeeded').length;
    const failed = vmoveList.filter((v) => v.status === 'failed').length;
    const done = succeeded + failed;
    const percent = total > 0 ? Math.round((done / total) * 100) : 100;
    const status = detail && detail.status;

    let progressStatus = 'success';
    if (failed > 0) {
      progressStatus = 'exception';
    } else if (this.isRunning) {
      progressStatus = 'active';
    }

    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Descriptions size="small" column={4}>
              <Descriptions.Item label={t('Status')}>
                <Tag color={NOTIFICATION_STATUS_MAP[status] || 'default'}>
                  {status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('Total VMs')}>
                {total}
              </Descriptions.Item>
              <Descriptions.Item label={t('Succeeded')}>
                <Text style={{ color: '#52c41a' }}>{succeeded}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('Failed')}>
                <Text style={{ color: failed > 0 ? '#ff4d4f' : undefined }}>
                  {failed}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          {total > 0 && (
            <Col>
              <Progress
                type="circle"
                percent={percent}
                size={48}
                status={progressStatus}
                format={() => `${done}/${total}`}
              />
            </Col>
          )}
        </Row>
      </Card>
    );
  }

  renderVMovesTable() {
    const { vmoveList, isLoading } = this.state;

    return (
      <Card
        size="small"
        title={
          <span>
            <SwapOutlined style={{ marginRight: 8 }} />
            {t('VM Evacuations')}
            {this.isRunning && (
              <Tag color="processing" style={{ marginLeft: 8 }}>
                <LoadingOutlined style={{ marginRight: 4 }} />
                {t('Auto-refreshing every 5s')}
              </Tag>
            )}
          </span>
        }
      >
        <Table
          columns={vmoveColumns}
          dataSource={vmoveList}
          rowKey="uuid"
          loading={isLoading}
          pagination={false}
          size="small"
        />
      </Card>
    );
  }

  render() {
    const { vmoveList, isLoading } = this.state;

    if (isLoading && vmoveList.length === 0) {
      return <Card loading size="small" />;
    }

    if (!isLoading && vmoveList.length === 0) {
      return (
        <Card size="small">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('No VM evacuations for this notification')}
          />
        </Card>
      );
    }

    return (
      <div>
        {this.renderSummary()}
        {this.renderVMovesTable()}
      </div>
    );
  }
}

export default inject('rootStore')(observer(RecoveryProgress));
