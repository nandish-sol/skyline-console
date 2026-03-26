import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalContainersStore from 'stores/barbican/containers';
import { getOriginEndpoint } from 'client/client/constants';
import actionConfigs from './actions';

export class Containers extends Base {
  init() {
    this.store = globalContainersStore;
  }

  get policy() {
    return 'container:get';
  }

  get name() {
    return t('Containers');
  }

  get endpoint() {
    return getOriginEndpoint('barbican');
  }

  get checkEndpoint() {
    return true;
  }

  get actionConfigs() {
    return actionConfigs;
  }

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      routeName: 'barbicanContainerDetail',
    },
    {
      title: t('Type'),
      dataIndex: 'type',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
    },
    {
      title: t('Secrets'),
      dataIndex: 'secret_refs',
      render: (refs) => (refs ? refs.length : 0),
    },
    {
      title: t('Created'),
      dataIndex: 'created',
      valueRender: 'toLocalTime',
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('Name'),
        name: 'name',
      },
    ];
  }
}

export default inject('rootStore')(observer(Containers));
