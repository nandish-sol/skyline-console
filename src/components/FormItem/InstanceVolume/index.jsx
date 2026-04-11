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
import styles from './index.less';

// Pull the backend name + provisioning mode out of a Cinder volume type's
// extra specs. The UI uses these to decide whether the Thin/Thick toggle
// should show (mode set) and whether it should be editable (sibling type
// on the same backend has the opposite mode).
//
// Convention:
//   extra_specs.volume_backend_name  → opaque backend identifier
//   extra_specs.provisioning:type    → "thin" | "thick"
//
// Ceph RBD detection is a heuristic fallback: backends whose name or
// driver contains "ceph" / "rbd" are forced to thin regardless of the
// extra spec, because Ceph RBD can't do thick.
const extractBackendInfo = (typeOption) => {
  if (!typeOption || !typeOption.originData) return null;
  const specs = typeOption.originData.extra_specs || {};
  const backend = specs.volume_backend_name || '';
  const rawMode = (specs['provisioning:type'] || '').toLowerCase();
  const mode = rawMode === 'thin' || rawMode === 'thick' ? rawMode : null;
  const backendLc = backend.toLowerCase();
  const isCeph = backendLc.includes('ceph') || backendLc.includes('rbd');
  return { backend, mode, isCeph };
};

// Build a map of { backend_name: {thin: type_id, thick: type_id} }
// by scanning the full volume-type list. A backend is considered to
// support both modes only when we find at least one type with
// provisioning:type=thin AND one with provisioning:type=thick sharing
// the same volume_backend_name.
const buildBackendModes = (options) => {
  const map = {};
  (options || []).forEach((it) => {
    const info = extractBackendInfo(it);
    if (!info || !info.backend || !info.mode) return;
    if (!map[info.backend]) map[info.backend] = {};
    map[info.backend][info.mode] = it.value;
  });
  return map;
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
        const { type, deleteType } = this.state;
        const deleteTypeLabel =
          deleteType === 1
            ? t('Deleted with the instance')
            : t('Not deleted with the instance');
        const typeOption = options.find((it) => it.value === type);
        const info = extractBackendInfo(typeOption);
        const value = {
          ...this.state,
          deleteTypeLabel,
          typeOption,
          provisioningType: info ? info.mode : null,
          backend: info ? info.backend : null,
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

  // Toggle between the currently-selected type and its sibling on the
  // same backend that has the opposite provisioning mode. If no sibling
  // exists (backend supports only one mode) the handler is a no-op and
  // the toggle is rendered disabled.
  onProvisioningToggle = (e) => {
    const newMode = e.target.value;
    const { options = [] } = this.props;
    const modes = buildBackendModes(options);
    const currentTypeOption = options.find(
      (it) => it.value === this.state.type
    );
    const info = extractBackendInfo(currentTypeOption);
    if (!info || !info.backend) return;
    const siblingId = (modes[info.backend] || {})[newMode];
    if (!siblingId || siblingId === this.state.type) return;
    this.setState({ type: siblingId }, this.onChange);
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
    } = this.state;
    const { name, showDelete = true } = this.props;

    const modes = buildBackendModes(options);
    const currentTypeOption = options.find((it) => it.value === type);
    const currentInfo = extractBackendInfo(currentTypeOption);
    const currentBackendModes =
      (currentInfo && modes[currentInfo.backend]) || {};
    // Row visibility: as soon as the user has picked a volume type we
    // render the row. When the type carries a provisioning:type extra
    // spec we wire up the toggle; otherwise we render a disabled
    // toggle with an explanatory tooltip so users understand why the
    // backend doesn't offer the choice.
    const hasProvisioningSupport = !!(currentInfo && currentInfo.mode);
    const showProvisioning = !!currentTypeOption;
    const supportsThin =
      !!currentBackendModes.thin || currentInfo?.mode === 'thin';
    // Ceph backends can never do thick — disable the button and show a
    // small inline note.
    const supportsThick = currentInfo?.isCeph
      ? false
      : !!currentBackendModes.thick || currentInfo?.mode === 'thick';
    const currentMode = currentInfo?.mode || null;
    const thinDisabled = !supportsThin;
    const thickDisabled = !supportsThick;
    // The toggle is editable only when both sibling modes are actually
    // available for this backend. Otherwise we show it disabled with
    // the one supported mode pre-selected (or nothing, if the backend
    // doesn't advertise provisioning at all).
    const toggleDisabled =
      !hasProvisioningSupport || !(supportsThin && supportsThick);

    // Explain the toggle state in the tooltip. Three cases:
    //   1. No provisioning:type spec at all → "backend doesn't support it"
    //   2. Only one mode available → "backend only supports <mode>"
    //   3. Both available → "pick thin or thick"
    let provisioningTooltip;
    if (!hasProvisioningSupport) {
      provisioningTooltip = t(
        'This backend does not support thin/thick provisioning. Provisioning is controlled by the storage driver and cannot be chosen per-volume.'
      );
    } else if (toggleDisabled) {
      provisioningTooltip = t(
        'This backend only supports {mode} provisioning. Pick a different volume type to access the other mode.',
        { mode: currentMode || '-' }
      );
    } else {
      provisioningTooltip = t(
        'Thin = space allocated on demand. Thick = full size reserved up-front. Switches to the sibling volume type on the same backend.'
      );
    }

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

    const provisioningRow = showProvisioning ? (
      <div style={{ marginTop: 8, marginBottom: 4 }}>
        <span className={styles.label}>
          {t('Provisioning')}
          <Tooltip title={provisioningTooltip}>
            <InfoCircleOutlined
              style={{ marginLeft: 4, color: 'rgba(0,0,0,0.45)' }}
            />
          </Tooltip>
        </span>
        <Tooltip
          title={toggleDisabled ? provisioningTooltip : ''}
          placement="top"
        >
          <Radio.Group
            value={currentMode}
            onChange={this.onProvisioningToggle}
            size="small"
            style={{ marginLeft: 8 }}
            disabled={toggleDisabled}
          >
            <Radio.Button value="thin" disabled={thinDisabled}>
              {t('Thin')}
            </Radio.Button>
            <Radio.Button value="thick" disabled={thickDisabled}>
              {t('Thick')}
            </Radio.Button>
          </Radio.Group>
        </Tooltip>
        {currentInfo?.isCeph && (
          <span
            style={{
              marginLeft: 8,
              color: 'rgba(0,0,0,0.45)',
              fontSize: 12,
            }}
          >
            {t('(Ceph RBD is always thin)')}
          </span>
        )}
        {!hasProvisioningSupport && (
          <span
            style={{
              marginLeft: 8,
              color: 'rgba(0,0,0,0.45)',
              fontSize: 12,
            }}
          >
            {t('(not supported on this backend)')}
          </span>
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
        {provisioningRow}
      </Form.Item>
    );
  }
}
