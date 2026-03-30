import React from 'react';
import { observer, inject } from 'mobx-react';
import Base from 'containers/List';
import globalActionStore from 'stores/watcher/actions';
import { watcherEndpoint } from 'client/client/constants';
import { Link } from 'react-router-dom';

export class Actions extends Base {
  init() {
    this.store = globalActionStore;
  }

  get policy() {
    return '';
  }

  get endpoint() {
    return watcherEndpoint();
  }

  get checkEndpoint() {
    return true;
  }

  get name() {
    return t('Actions');
  }

  get rowKey() {
    return 'uuid';
  }

  getColumns() {
    return [
      {
        title: t('UUID'),
        dataIndex: 'uuid',
        isLink: true,
        routeName: this.getRouteName('watcherActionDetail'),
      },
      {
        title: t('Action Type'),
        dataIndex: 'action_type',
        isHideable: true,
      },
      {
        title: t('State'),
        dataIndex: 'state',
        isHideable: true,
      },
      {
        title: t('Action Plan UUID'),
        dataIndex: 'action_plan_uuid',
        isHideable: true,
        render: (value) => {
          if (!value) return '-';
          const path = this.getRoutePath('watcherActionPlanDetail', {
            id: value,
          });
          return <Link to={path}>{value}</Link>;
        },
      },
    ];
  }

  get searchFilters() {
    return [
      {
        label: t('Action Plan UUID'),
        name: 'action_plan_uuid',
      },
    ];
  }
}

export default inject('rootStore')(observer(Actions));
