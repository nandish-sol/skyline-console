import Base from 'containers/List';
import { inject, observer } from 'mobx-react';
import { ActionStore } from 'stores/watcher/actions';

export class ActionsList extends Base {
  init() {
    this.store = new ActionStore();
  }

  get policy() {
    return '';
  }

  get name() {
    return t('Actions');
  }

  get rowKey() {
    return 'uuid';
  }

  get paramsFunc() {
    return (params) => {
      const { all_projects, ...rest } = params;
      return rest;
    };
  }

  updateFetchParams = (params) => {
    const { id, ...rest } = params;
    return {
      ...rest,
      action_plan_uuid: id,
    };
  };

  getColumns = () => [
    {
      title: t('UUID'),
      dataIndex: 'uuid',
      isLink: true,
      routeName: this.getRouteName('watcherActionDetail'),
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
      title: t('Input Parameters'),
      dataIndex: 'input_parameters',
      render: (value) => {
        if (value && Object.keys(value).length > 0) {
          return JSON.stringify(value);
        }
        return '-';
      },
    },
  ];
}

export default inject('rootStore')(observer(ActionsList));
