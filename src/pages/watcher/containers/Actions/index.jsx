import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionStore from 'stores/watcher/actions';
import { watcherEndpoint } from 'client/client/constants';

export class Actions extends Base {
  init() {
    this.store = globalActionStore;
  }

  get policy() {
    return 'watcher:action:get_all';
  }

  get name() {
    return t('Actions');
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get rowKey() {
    return 'uuid';
  }

  getColumns = () => [
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      routeName: 'watcherActionDetail',
    },
    {
      title: t('Action Type'),
      dataIndex: 'action_type',
    },
    {
      title: t('State'),
      dataIndex: 'state',
    },
    {
      title: t('Action Plan UUID'),
      dataIndex: 'action_plan_uuid',
    },
  ];

  get searchFilters() {
    return [
      {
        label: t('State'),
        name: 'state',
      },
    ];
  }
}

export default inject('rootStore')(observer(Actions));
