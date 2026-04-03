import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.templateInfoCard, this.configCard];
  }

  get rightCards() {
    return [this.imageInfoCard];
  }

  get templateInfoCard() {
    const options = [
      {
        label: t('Template Name'),
        dataIndex: 'xloud_template_name',
        render: (value) => value || this.detailData.name || '-',
      },
      {
        label: t('Version'),
        dataIndex: 'xloud_template_version',
        render: (value) => value || '1.0',
      },
      {
        label: t('Category'),
        dataIndex: 'xloud_template_category',
        render: (value) => {
          const map = {
            'base-os': t('Base OS'),
            'web-server': t('Web Server'),
            database: t('Database'),
            application: t('Application'),
            custom: t('Custom'),
          };
          return map[value] || value || '-';
        },
      },
      {
        label: t('Description'),
        dataIndex: 'xloud_template_description',
        render: (value) => value || '-',
      },
      {
        label: t('Source Instance'),
        dataIndex: 'xloud_template_source_instance',
        copyable: true,
        render: (value) => value || '-',
      },
      {
        label: t('Created By'),
        dataIndex: 'xloud_template_created_by',
        render: (value) => value || '-',
      },
      {
        label: t('Template Created'),
        dataIndex: 'xloud_template_created_at',
        render: (value) => value || '-',
      },
    ];
    return {
      title: t('Template Info'),
      options,
    };
  }

  get configCard() {
    const options = [
      {
        label: t('Flavor'),
        dataIndex: 'xloud_template_flavor_name',
        render: (value) => value || '-',
      },
      {
        label: t('vCPUs'),
        dataIndex: 'xloud_template_vcpus',
        render: (value) => value || '-',
      },
      {
        label: t('RAM (MB)'),
        dataIndex: 'xloud_template_ram_mb',
        render: (value) => value || '-',
      },
      {
        label: t('Disk (GB)'),
        dataIndex: 'xloud_template_disk_gb',
        render: (value) => value || '-',
      },
      {
        label: t('Network'),
        dataIndex: 'xloud_template_network_name',
        render: (value) => value || '-',
      },
      {
        label: t('Security Groups'),
        dataIndex: 'xloud_template_security_groups',
        render: (value) => {
          if (!value) return '-';
          try {
            const arr = JSON.parse(value);
            return Array.isArray(arr) ? arr.join(', ') : value;
          } catch {
            return value;
          }
        },
      },
      {
        label: t('Key Pair'),
        dataIndex: 'xloud_template_keypair',
        render: (value) => value || '-',
      },
      {
        label: t('Availability Zone'),
        dataIndex: 'xloud_template_az',
        render: (value) => value || '-',
      },
    ];
    return {
      title: t('VM Configuration'),
      options,
    };
  }

  get imageInfoCard() {
    const options = [
      {
        label: t('Image ID'),
        dataIndex: 'id',
        copyable: true,
      },
      {
        label: t('Image Status'),
        dataIndex: 'status',
      },
      {
        label: t('Size'),
        dataIndex: 'size',
        valueRender: 'bytes',
      },
      {
        label: t('Disk Format'),
        dataIndex: 'disk_format',
        valueRender: 'uppercase',
      },
      {
        label: t('Container Format'),
        dataIndex: 'container_format',
      },
      {
        label: t('Visibility'),
        dataIndex: 'visibility',
      },
      {
        label: t('Protected'),
        dataIndex: 'protected',
        valueRender: 'yesNo',
      },
      {
        label: t('Checksum'),
        dataIndex: 'checksum',
        copyable: true,
      },
      {
        label: t('Created At'),
        dataIndex: 'created_at',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Updated At'),
        dataIndex: 'updated_at',
        valueRender: 'toLocalTime',
      },
    ];
    return {
      title: t('Image Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
