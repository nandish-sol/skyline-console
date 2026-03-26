import React from 'react';
import { inject, observer } from 'mobx-react';
import Base from 'containers/BaseDetail';

export class BaseDetail extends Base {
  get leftCards() {
    return [this.baseInfoCard];
  }

  get baseInfoCard() {
    const options = [
      {
        label: t('Type'),
        dataIndex: 'type',
      },
      {
        label: t('Status'),
        dataIndex: 'status',
      },
      {
        label: t('Secret References'),
        dataIndex: 'secret_refs',
        render: (refs) => {
          if (!refs || refs.length === 0) return '-';
          return (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {refs.map((ref, i) => (
                <li key={i}>
                  {ref.name}: {ref.secret_ref}
                </li>
              ))}
            </ul>
          );
        },
      },
      {
        label: t('Created'),
        dataIndex: 'created',
        valueRender: 'toLocalTime',
      },
      {
        label: t('Updated'),
        dataIndex: 'updated',
        valueRender: 'toLocalTime',
      },
    ];
    return {
      title: t('Base Info'),
      options,
    };
  }
}

export default inject('rootStore')(observer(BaseDetail));
