import React from 'react';
import { Select, Row, Col, Form } from 'antd';
import PropTypes from 'prop-types';
import styles from './index.less';

export default class InstanceCdrom extends React.Component {
  static propTypes = {
    value: PropTypes.any,
    images: PropTypes.array,
    volumes: PropTypes.array,
  };

  static defaultProps = {
    value: {},
    images: [],
    volumes: [],
  };

  constructor(props) {
    super(props);
    const { sourceType, sourceId } = props.value || {};
    this.state = {
      sourceType: sourceType || 'image',
      sourceId: sourceId || undefined,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      nextProps.value &&
      nextProps.value.sourceType !== prevState.sourceType
    ) {
      return {
        sourceType: nextProps.value.sourceType,
        sourceId: nextProps.value.sourceId,
      };
    }
    return null;
  }

  componentDidMount() {
    this.onChange();
  }

  onChange = () => {
    const { onChange } = this.props;
    if (onChange) {
      const { sourceType, sourceId } = this.state;
      onChange({ sourceType, sourceId });
    }
  };

  onSourceTypeChange = (value) => {
    this.setState(
      {
        sourceType: value,
        sourceId: undefined,
      },
      this.onChange
    );
  };

  onSourceChange = (value) => {
    this.setState(
      {
        sourceId: value,
      },
      this.onChange
    );
  };

  getSourceOptions() {
    const { sourceType } = this.state;
    const { images = [], volumes = [] } = this.props;
    if (sourceType === 'image') {
      return images.map((img) => ({
        value: img.id,
        label: `${img.name} (${Math.max(
          Math.ceil((img.size || 0) / 1073741824),
          1
        )} GiB)`,
      }));
    }
    return volumes.map((vol) => ({
      value: vol.id,
      label: `${vol.name} (${vol.size} GiB)`,
    }));
  }

  render() {
    const { sourceType, sourceId } = this.state;
    const { name } = this.props;
    const sourceOptions = this.getSourceOptions();

    return (
      <Form.Item className={styles['instance-cdrom']} name={name}>
        <Row gutter={16}>
          <Col span={7}>
            <span className={styles.label}>{t('Source')}</span>
            <Select
              value={sourceType}
              onChange={this.onSourceTypeChange}
              className={styles.select}
              options={[
                { value: 'image', label: t('Image') },
                { value: 'volume', label: t('Volume') },
              ]}
            />
          </Col>
          <Col span={17}>
            <span className={styles.label}>
              {sourceType === 'image' ? t('Image') : t('Volume')}
            </span>
            <Select
              value={sourceId}
              onChange={this.onSourceChange}
              className={styles['source-select']}
              placeholder={
                sourceType === 'image'
                  ? t('Select an image')
                  : t('Select a volume')
              }
              showSearch
              optionFilterProp="label"
              options={sourceOptions}
            />
          </Col>
        </Row>
      </Form.Item>
    );
  }
}
