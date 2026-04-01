import React from 'react';
import { Select, Row, Col, Form } from 'antd';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import globalImageStore from 'stores/glance/image';
import { VolumeStore } from 'stores/cinder/volume';
import styles from './index.less';

const { OptGroup, Option } = Select;

class InstanceCdrom extends React.Component {
  constructor(props) {
    super(props);
    const { sourceType, sourceId } = props.value || {};
    this.state = {
      sourceType: sourceType || undefined,
      sourceId: sourceId || undefined,
    };
    this.volumeStore = new VolumeStore();
    this.volumeStore.fetchList({ status: 'available' });
  }

  componentDidMount() {
    this.onChange();
  }

  onSourceChange = (value) => {
    if (!value) {
      this.setState(
        { sourceType: undefined, sourceId: undefined },
        this.onChange
      );
      return;
    }
    const [type, id] = value.split('::');
    this.setState({ sourceType: type, sourceId: id }, this.onChange);
  };

  getCompositeValue() {
    const { sourceType, sourceId } = this.state;
    if (sourceType && sourceId) {
      return `${sourceType}::${sourceId}`;
    }
    return undefined;
  }

  onChange = () => {
    const { onChange } = this.props;
    if (onChange) {
      const { sourceType, sourceId } = this.state;
      onChange({ sourceType, sourceId });
    }
  };

  render() {
    const { name } = this.props;
    const images = toJS(globalImageStore.list.data) || [];
    const volumes = (toJS(this.volumeStore.list.data) || []).filter(
      (v) => v.status === 'available'
    );
    const compositeValue = this.getCompositeValue();

    return (
      <Form.Item className={styles['instance-cdrom']} name={name}>
        <Row gutter={16}>
          <Col span={24}>
            <Select
              value={compositeValue}
              onChange={this.onSourceChange}
              className={styles['source-select']}
              placeholder={t('Select an image or volume as CD-ROM')}
              showSearch
              optionFilterProp="children"
              allowClear
              style={{ width: '100%' }}
            >
              {images.length > 0 && (
                <OptGroup label={t('Images')}>
                  {images.map((img) => (
                    <Option key={`image::${img.id}`} value={`image::${img.id}`}>
                      {img.name} (
                      {Math.max(
                        Math.ceil(
                          (img.virtual_size || img.size || 0) / 1073741824
                        ),
                        img.min_disk || 1
                      )}{' '}
                      GiB)
                    </Option>
                  ))}
                </OptGroup>
              )}
              {volumes.length > 0 && (
                <OptGroup label={t('Volumes')}>
                  {volumes.map((vol) => (
                    <Option
                      key={`volume::${vol.id}`}
                      value={`volume::${vol.id}`}
                    >
                      {vol.name} ({vol.size} GiB)
                    </Option>
                  ))}
                </OptGroup>
              )}
            </Select>
          </Col>
        </Row>
      </Form.Item>
    );
  }
}

export default observer(InstanceCdrom);
