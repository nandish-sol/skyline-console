import React, { Component } from 'react';
import { Modal, Upload, Button, Slider, message, Spin } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  ScissorOutlined,
} from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import client from 'client';

const OUTPUT_DIMENSION = 256;
const JPEG_QUALITY = 0.82;
const MAX_OUTPUT_BYTES = 180 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

// Render the cropped rectangle to a square JPEG of OUTPUT_DIMENSION.
async function renderCrop(sourceDataUri, cropPixels) {
  const img = await loadImage(sourceDataUri);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_DIMENSION;
  canvas.height = OUTPUT_DIMENSION;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    OUTPUT_DIMENSION,
    OUTPUT_DIMENSION
  );
  const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const sizeBytes = Math.floor((base64.length * 3) / 4);
  return { base64, dataUri, sizeBytes };
}

export default class ProfileImageModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: 'view', // 'view' | 'crop'
      previewDataUri: props.currentImageSrc || null,
      sourceDataUri: null, // original full-res image being cropped
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
      compressed: null,
      loading: false,
      saving: false,
      removing: false,
      dirty: false,
      removedInSession: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { currentImageSrc } = this.props;
    const { dirty, compressed } = this.state;
    if (
      prevProps.currentImageSrc !== currentImageSrc &&
      !dirty &&
      !compressed
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ previewDataUri: currentImageSrc || null });
    }
  }

  handleBeforeUpload = async (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      message.error(t('Unsupported image type. Use PNG, JPEG, or WebP.'));
      return false;
    }
    if (file.size > 8 * 1024 * 1024) {
      message.error(t('File too large. Maximum 8 MB.'));
      return false;
    }
    this.setState({ loading: true });
    try {
      const sourceDataUri = await fileToDataUri(file);
      this.setState({
        sourceDataUri,
        mode: 'crop',
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        loading: false,
      });
    } catch (e) {
      message.error(e.message || t('Failed to read image.'));
      this.setState({ loading: false });
    }
    return false;
  };

  onCropChange = (crop) => this.setState({ crop });

  onZoomChange = (zoom) => this.setState({ zoom });

  onCropComplete = (_areaPercent, areaPixels) =>
    this.setState({ croppedAreaPixels: areaPixels });

  handleApplyCrop = async () => {
    const { sourceDataUri, croppedAreaPixels } = this.state;
    if (!sourceDataUri || !croppedAreaPixels) return;
    this.setState({ loading: true });
    try {
      const out = await renderCrop(sourceDataUri, croppedAreaPixels);
      if (out.sizeBytes > MAX_OUTPUT_BYTES) {
        message.error(t('Cropped image is too large. Try a smaller region.'));
        this.setState({ loading: false });
        return;
      }
      this.setState({
        mode: 'view',
        previewDataUri: out.dataUri,
        compressed: {
          base64: out.base64,
          format: 'jpeg',
          sizeBytes: out.sizeBytes,
        },
        dirty: true,
        loading: false,
        sourceDataUri: null,
      });
    } catch (e) {
      message.error(e.message || t('Failed to crop image.'));
      this.setState({ loading: false });
    }
  };

  handleCancelCrop = () => {
    this.setState({
      mode: 'view',
      sourceDataUri: null,
      croppedAreaPixels: null,
    });
  };

  handleSave = async () => {
    const { compressed } = this.state;
    const { onCancel, onSuccess } = this.props;
    if (!compressed) {
      onCancel();
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
      if (onSuccess) {
        onSuccess({
          dataUri: this.state.previewDataUri,
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
    const { onSuccess } = this.props;
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
      if (onSuccess) {
        onSuccess({ dataUri: null, response: null });
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

  renderCropUI() {
    const { sourceDataUri, crop, zoom, loading } = this.state;
    return (
      <div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 320,
            background: '#1a1a1a',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Cropper
            image={sourceDataUri}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={this.onCropChange}
            onZoomChange={this.onZoomChange}
            onCropComplete={this.onCropComplete}
          />
        </div>
        <div style={{ marginTop: 16, padding: '0 8px' }}>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
            {t('Zoom')}
          </div>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={this.onZoomChange}
            disabled={loading}
          />
        </div>
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          {t('Drag to reposition, use the slider to zoom.')}
        </div>
      </div>
    );
  }

  renderViewUI() {
    const { previewDataUri, loading, busy } = this.state;
    return (
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
          {previewDataUri && this.state.compressed && (
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
            'PNG, JPEG, or WebP (max 8 MB). Images are cropped and resized to {max}x{max}.',
            { max: OUTPUT_DIMENSION }
          )}
        </div>
      </div>
    );
  }

  render() {
    const { visible, onCancel } = this.props;
    const {
      mode,
      compressed,
      dirty,
      saving,
      removing,
      loading,
      removedInSession,
    } = this.state;

    const canSave = !!compressed && dirty;
    const busy = saving || removing;
    const hasServerImage = !!this.props.currentImageSrc && !removedInSession;

    let footer;
    if (mode === 'crop') {
      footer = [
        <Button
          key="cancel-crop"
          onClick={this.handleCancelCrop}
          disabled={loading}
        >
          {t('Cancel')}
        </Button>,
        <Button
          key="apply-crop"
          type="primary"
          icon={<ScissorOutlined />}
          loading={loading}
          onClick={this.handleApplyCrop}
          style={{
            background: 'var(--primary-color)',
            borderColor: 'var(--primary-color)',
          }}
        >
          {t('Apply Crop')}
        </Button>,
      ];
    } else {
      footer = [
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
          style={{
            background: 'var(--primary-color)',
            borderColor: 'var(--primary-color)',
          }}
        >
          {t('Save')}
        </Button>,
      ];
    }

    return (
      <Modal
        visible={visible}
        open={visible}
        title={
          mode === 'crop' ? t('Crop Profile Image') : t('Change Profile Image')
        }
        onCancel={mode === 'crop' ? this.handleCancelCrop : onCancel}
        maskClosable={!busy && mode !== 'crop'}
        closable={!busy}
        footer={footer}
        destroyOnClose
        width={mode === 'crop' ? 520 : 460}
      >
        {mode === 'crop' ? this.renderCropUI() : this.renderViewUI()}
      </Modal>
    );
  }
}
