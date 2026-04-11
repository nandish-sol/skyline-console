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

// Pull the backend name + provisioning capability out of a Cinder
// volume type's extra specs. The Cinder scheduler's CapabilitiesFilter
// understands two standard extra-spec keys for provisioning — we use
// those as the ONLY source of truth:
//
//   capabilities:thin_provisioning_support  = "<is> True"
//   capabilities:thick_provisioning_support = "<is> True"
//
// A volume type sets one (or both) to route to backends that report a
// matching capability via get_volume_stats(). Any type that carries
// neither key is treated as "provisioning-agnostic" — the toggle
// shows disabled with an explanatory tooltip.
//
// Accept the common `<is> True`, `true`, `1`, `yes` forms for boolean
// values — Cinder doc examples use all of these.
const parseBoolSpec = (val) => {
  if (val == null) return false;
  const s = String(val).trim().toLowerCase();
  return /(^|\s)(true|1|yes)$/.test(s);
};

const extractBackendInfo = (typeOption) => {
  if (!typeOption || !typeOption.originData) return null;
  const specs = typeOption.originData.extra_specs || {};
  const backend = specs.volume_backend_name || '';

  const supportsThin = parseBoolSpec(
    specs['capabilities:thin_provisioning_support']
  );
  const supportsThick = parseBoolSpec(
    specs['capabilities:thick_provisioning_support']
  );

  // Pre-selected radio state for THIS type:
  //   only thin  → 'thin'
  //   only thick → 'thick'
  //   both       → null (user actively picks)
  //   neither    → null (toggle disabled)
  let mode = null;
  if (supportsThin && !supportsThick) mode = 'thin';
  else if (supportsThick && !supportsThin) mode = 'thick';

  return {
    backend,
    mode,
    supportsBoth: supportsThin && supportsThick,
    supportsThin,
    supportsThick,
  };
};

// Build a map of { backend_name: {thin: type_id, thick: type_id} }
// by scanning the full volume-type list. For each backend we record
// the first type that advertises thin support and the first that
// advertises thick support. A single type that supports both appears
// under both keys.
const buildBackendModes = (options) => {
  const map = {};
  (options || []).forEach((it) => {
    const info = extractBackendInfo(it);
    if (!info || !info.backend) return;
    const bucket = map[info.backend] || (map[info.backend] = {});
    if (info.supportsThin && !bucket.thin) bucket.thin = it.value;
    if (info.supportsThick && !bucket.thick) bucket.thick = it.value;
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
    // Row visibility: always render once a type is picked. If that
    // type has no provisioning capability info at all, the toggle is
    // disabled with an explanatory tooltip.
    const showProvisioning = !!currentTypeOption;
    const hasProvisioningSupport =
      !!currentInfo &&
      (currentInfo.supportsThin ||
        currentInfo.supportsThick ||
        currentInfo.supportsBoth);
    const supportsThin =
      !!currentBackendModes.thin || (currentInfo && currentInfo.supportsThin);
    const supportsThick =
      !!currentBackendModes.thick || (currentInfo && currentInfo.supportsThick);
    // Pre-selected mode: if the current type exposes a single mode use
    // that; if it supports both explicitly (standard capabilities
    // flags) then leave it unselected so the user picks; if neither,
    // leave it unselected.
    const currentMode = currentInfo?.mode || null;
    const thinDisabled = !supportsThin;
    const thickDisabled = !supportsThick;
    // The toggle is editable when both modes are reachable for this
    // backend — either because of a sibling type OR because the same
    // type's standard capabilities flags report both.
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
