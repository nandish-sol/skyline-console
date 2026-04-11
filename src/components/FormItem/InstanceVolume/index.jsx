// Copyright 2021 99cloud
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
import {
  Select,
  Checkbox,
  Row,
  Col,
  Form,
  InputNumber,
  Radio,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import client from 'client';
import styles from './index.less';

// Keys the operator configures under skyline's volume_provisioning_mapping
// setting. Values are Cinder volume type IDs (or names). When neither is
// set, the whole Thin/Thick selector is hidden and the component falls
// back to the plain-old volume type dropdown.
const PROVISIONING_KEYS = ['thin', 'thick'];

// Heuristic: flag a volume type as Ceph-backed when its volume_backend_name
// extra spec contains "ceph" or "rbd". Used to warn admins who map
// "thick" to a Ceph pool (Ceph RBD is always thin — thick is impossible).
const isCephBacked = (typeOption) => {
  if (!typeOption || !typeOption.originData) return false;
  const specs = typeOption.originData.extra_specs || {};
  const backend = (specs.volume_backend_name || '').toLowerCase();
  return backend.includes('ceph') || backend.includes('rbd');
};

export default class InstanceVolume extends React.Component {
  static propTypes = {
    options: PropTypes.array,
    value: PropTypes.any,
    minSize: PropTypes.number,
  };

  static defaultProps = {
    options: [],
    value: {},
    minSize: 0,
  };

  constructor(props) {
    super(props);
    const { type, size, deleteType } = props.value || {};
    const { minSize } = props;
    this.state = {
      type,
      size,
      deleteType,
      minSize,
      provisioningMapping: null,
      provisioningType: null,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.options !== prevState.options ||
      nextProps.minSize !== prevState.minSize
    ) {
      const { options, value, minSize } = nextProps;
      return {
        options,
        type: value.type,
        minSize,
      };
    }
    return null;
  }

  componentDidMount() {
    this.onChange();
    this.fetchProvisioningMapping();
  }

  // eslint-disable-next-line react/sort-comp
  checkVolume = (callback) => {
    const { type } = this.state;
    if (!type) {
      this.setState(
        {
          errorMsg: t('Please select a type!'),
          validateStatus: 'error',
        },
        callback
      );
      return;
    }
    this.setState(
      {
        errorMsg: undefined,
        validateStatus: 'success',
      },
      callback
    );
  };

  onChange = () => {
    this.checkVolume(() => {
      const { onChange, options = [] } = this.props;
      if (onChange) {
        const { type, deleteType, provisioningType } = this.state;
        const deleteTypeLabel =
          deleteType === 1
            ? t('Deleted with the instance')
            : t('Not deleted with the instance');
        const typeOption = options.find((it) => it.value === type);
        const value = {
          ...this.state,
          deleteTypeLabel,
          typeOption,
          provisioningType,
        };
        onChange(value);
      }
    });
  };

  onSelectChange = (value) => {
    this.setState(
      {
        type: value,
      },
      this.onChange
    );
  };

  onInputChange = (value) => {
    this.setState(
      {
        size: value,
      },
      this.onChange
    );
  };

  onDeleteChange = () => {
    const { deleteType } = this.state;
    this.setState(
      {
        deleteType: 1 - deleteType,
      },
      this.onChange
    );
  };

  onProvisioningChange = (e) => {
    const newProvType = e.target.value;
    const { options = [] } = this.props;
    this.setState((prev) => {
      const mappedTypeId =
        prev.provisioningMapping && prev.provisioningMapping[newProvType];
      const matched =
        mappedTypeId && options.find((it) => it.value === mappedTypeId);
      return {
        provisioningType: newProvType,
        // Auto-switch the selected volume type to the operator-mapped one.
        type: matched ? matched.value : prev.type,
      };
    }, this.onChange);
  };

  getBackendWarning() {
    const { provisioningType, type } = this.state;
    const { options = [] } = this.props;
    if (provisioningType !== 'thick') return null;
    const typeOption = options.find((it) => it.value === type);
    if (!typeOption) return null;
    if (!isCephBacked(typeOption)) return null;
    return t(
      'Ceph RBD only supports thin provisioning. Selecting Thick on a Ceph-backed volume type has no effect.'
    );
  }

  fetchProvisioningMapping = async () => {
    try {
      const resp = await client.skyline.setting.show(
        'volume_provisioning_mapping'
      );
      const raw = (resp && resp.setting && resp.setting.value) || {};
      const filtered = {};
      PROVISIONING_KEYS.forEach((k) => {
        if (raw[k]) filtered[k] = raw[k];
      });
      if (Object.keys(filtered).length > 0) {
        this.setState({ provisioningMapping: filtered });
      }
    } catch (e) {
      // Setting absent or unreadable — feature stays hidden.
    }
  };

  render() {
    const {
      options,
      type,
      size,
      deleteType,
      validateStatus,
      errorMsg,
      minSize,
      provisioningMapping,
      provisioningType,
    } = this.state;
    const { name, showDelete = true } = this.props;
    const showProvisioningToggle =
      provisioningMapping && Object.keys(provisioningMapping).length > 0;
    const backendWarning = this.getBackendWarning();

    const selects = (
      <Select
        value={type}
        options={options}
        onChange={this.onSelectChange}
        className={styles.select}
        placeholder={t('Please select type')}
      />
    );
    const input = (
      <InputNumber
        value={size}
        onChange={this.onInputChange}
        min={minSize}
        style={{ maxWidth: '60%' }}
        precision={0}
        formatter={(value) => `$ ${value}`.replace(/\D/g, '')}
        onInput={(e) => this.onInputChange(e * 1)}
      />
    );
    const deleteValue = deleteType === 1;
    const checkbox = showDelete ? (
      <Checkbox onChange={this.onDeleteChange} checked={deleteValue}>
        {t('Deleted with the instance')}
      </Checkbox>
    ) : null;

    const provisioningRadio = showProvisioningToggle ? (
      <div style={{ marginBottom: 12 }}>
        <span className={styles.label}>
          {t('Provisioning')}
          <Tooltip
            title={t(
              'Thin = space allocated on demand. Thick = full size reserved up-front. Operator maps each mode to a Cinder volume type.'
            )}
          >
            <InfoCircleOutlined
              style={{ marginLeft: 4, color: 'rgba(0,0,0,0.45)' }}
            />
          </Tooltip>
        </span>
        <Radio.Group
          value={provisioningType}
          onChange={this.onProvisioningChange}
          size="small"
          style={{ marginLeft: 8 }}
        >
          {provisioningMapping.thin && (
            <Radio.Button value="thin">{t('Thin')}</Radio.Button>
          )}
          {provisioningMapping.thick && (
            <Radio.Button value="thick">{t('Thick')}</Radio.Button>
          )}
        </Radio.Group>
        {backendWarning && (
          <div
            style={{
              color: '#faad14',
              fontSize: 12,
              marginTop: 4,
              marginLeft: 80,
            }}
          >
            {backendWarning}
          </div>
        )}
      </div>
    ) : null;

    return (
      <Form.Item
        className={styles['instance-volume']}
        name={name}
        validateStatus={validateStatus}
        help={errorMsg}
      >
        {provisioningRadio}
        <Row gutter={24}>
          <Col span={8}>
            <span className={styles.label}>{t('Type')}</span>
            {selects}
          </Col>
          <Col span={14}>
            <span className={styles.label}>{t('Size')}</span>
            {input}
            <span className={styles['size-label']}>GiB</span>
            {checkbox}
          </Col>
        </Row>
      </Form.Item>
    );
  }
}
