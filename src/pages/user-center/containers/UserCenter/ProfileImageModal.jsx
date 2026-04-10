import React, { Component } from 'react';
import { Modal, Upload, Button, message, Spin } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import client from 'client';

const MAX_DIMENSION = 256;
const JPEG_QUALITY = 0.75;
const MAX_OUTPUT_BYTES = 150 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Resize + compress an image File via Canvas. Returns
// { base64 (no data URI prefix), format, sizeBytes, dataUri }.
async function compressImage(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(t('Unsupported image type. Use PNG, JPEG, or WebP.'));
  }
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const sizeBytes = Math.floor((base64.length * 3) / 4);
  if (sizeBytes > MAX_OUTPUT_BYTES) {
    throw new Error(
      t(
        'Image is too large even after compression. Please choose a smaller image.'
      )
    );
  }
  return { base64, format: 'jpeg', sizeBytes, dataUri };
}

export default class ProfileImageModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      previewDataUri: props.currentImageSrc || null,
      compressed: null,
      loading: false,
      saving: false,
      removing: false,
      dirty: false,
      removedInSession: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.currentImageSrc !== this.props.currentImageSrc &&
      !this.state.dirty &&
      !this.state.compressed
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ previewDataUri: this.props.currentImageSrc || null });
    }
  }

  handleBeforeUpload = async (file) => {
    this.setState({ loading: true });
    try {
      const compressed = await compressImage(file);
      this.setState({
        previewDataUri: compressed.dataUri,
        compressed,
        dirty: true,
        loading: false,
      });
    } catch (e) {
      message.error(e.message || t('Failed to process image.'));
      this.setState({ loading: false });
    }
    return false; // prevent Upload from auto-uploading
  };

  handleSave = async () => {
    const { compressed } = this.state;
    if (!compressed) {
      this.props.onCancel();
      return;
    }
    this.setState({ saving: true });
    try {
      const res = await client.skyline.profileImageUpload({
        profile_image_base64: compressed.base64,
        image_format: compressed.format,
      });
      message.success(t('Profile image updated.'));
      this.setState({ saving: false });
      if (this.props.onSuccess) {
        this.props.onSuccess({
          dataUri: compressed.dataUri,
          response: res,
        });
      }
    } catch (e) {
      const detail =
        (e && e.response && e.response.data && e.response.data.detail) ||
        (e && e.message) ||
        t('Failed to upload profile image.');
      message.error(detail);
      this.setState({ saving: false });
    }
  };

  handleClearPreview = () => {
    this.setState({
      previewDataUri: null,
      compressed: null,
      dirty: true,
    });
  };

  handleRemoveSaved = async () => {
    this.setState({ removing: true });
    try {
      await client.skyline.profileImageDelete();
      message.success(t('Profile image removed.'));
      this.setState({
        previewDataUri: null,
        compressed: null,
        dirty: false,
        removedInSession: true,
        removing: false,
      });
      if (this.props.onSuccess) {
        this.props.onSuccess({ dataUri: null, response: null });
      }
    } catch (e) {
      const detail =
        (e && e.response && e.response.data && e.response.data.detail) ||
        (e && e.message) ||
        t('Failed to remove profile image.');
      message.error(detail);
      this.setState({ removing: false });
    }
  };

  render() {
    const { visible, onCancel } = this.props;
    const {
      previewDataUri,
      loading,
      saving,
      removing,
      compressed,
      dirty,
      removedInSession,
    } = this.state;

    const canSave = !!compressed && dirty;
    const busy = saving || removing;
    const hasServerImage = !!this.props.currentImageSrc && !removedInSession;

    return (
      <Modal
        visible={visible}
        open={visible}
        title={t('Change Profile Image')}
        onCancel={onCancel}
        maskClosable={!busy}
        closable={!busy}
        footer={[
          hasServerImage && (
            <Button
              key="remove"
              danger
              icon={<DeleteOutlined />}
              loading={removing}
              disabled={saving}
              onClick={this.handleRemoveSaved}
            >
              {t('Remove')}
            </Button>
          ),
          <Button key="cancel" onClick={onCancel} disabled={busy}>
            {t('Cancel')}
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={saving}
            disabled={!canSave || removing}
            onClick={this.handleSave}
            style={{ background: '#197560', borderColor: '#197560' }}
          >
            {t('Save')}
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 160,
              height: 160,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: '#f0f0f0',
              border: '2px dashed #d9d9d9',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {loading ? (
              <Spin />
            ) : previewDataUri ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img
                src={previewDataUri}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: '#999' }}>{t('No image')}</span>
            )}
          </div>
          <div>
            <Upload
              accept="image/png,image/jpeg,image/webp"
              showUploadList={false}
              beforeUpload={this.handleBeforeUpload}
            >
              <Button icon={<UploadOutlined />} disabled={busy}>
                {t('Choose Image')}
              </Button>
            </Upload>
            {previewDataUri && compressed && (
              <Button
                onClick={this.handleClearPreview}
                disabled={busy}
                style={{ marginLeft: 8 }}
              >
                {t('Clear')}
              </Button>
            )}
          </div>
          <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
            {t(
              'PNG, JPEG, or WebP. Images are resized to {max}x{max} and compressed automatically.',
              { max: MAX_DIMENSION }
            )}
          </div>
        </div>
      </Modal>
    );
  }
}
