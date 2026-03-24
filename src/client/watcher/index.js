import Base from '../client/base';
import { watcherBase } from '../client/constants';

export class WatcherClient extends Base {
  get baseUrl() {
    return watcherBase();
  }

  get resources() {
    return [
      {
        name: 'goals',
        key: 'goals',
        responseKey: 'goal',
      },
      {
        name: 'strategies',
        key: 'strategies',
        responseKey: 'strategy',
      },
      {
        name: 'auditTemplates',
        key: 'audit_templates',
        responseKey: 'audit_template',
      },
      {
        name: 'audits',
        key: 'audits',
        responseKey: 'audit',
      },
      {
        name: 'actionPlans',
        key: 'action_plans',
        responseKey: 'action_plan',
      },
      {
        name: 'actions',
        key: 'actions',
        responseKey: 'action',
      },
    ];
  }
}

const watcherClient = new WatcherClient();
export default watcherClient;
