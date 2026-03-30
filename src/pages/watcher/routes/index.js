import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Goals from '../containers/Goals';
import GoalDetail from '../containers/Goals/Detail';
import Strategies from '../containers/Strategies';
import StrategyDetail from '../containers/Strategies/Detail';
import AuditTemplates from '../containers/AuditTemplates';
import AuditTemplateDetail from '../containers/AuditTemplates/Detail';
import Audits from '../containers/Audits';
import AuditDetail from '../containers/Audits/Detail';
import ActionPlans from '../containers/ActionPlans';
import ActionPlanDetail from '../containers/ActionPlans/Detail';
import Actions from '../containers/Actions';
import ActionDetail from '../containers/Actions/Detail';

const PATH = '/infra-optim';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/goals-admin`, component: Goals, exact: true },
      {
        path: `${PATH}/goals-admin/detail/:id`,
        component: GoalDetail,
        exact: true,
      },
      { path: `${PATH}/strategies-admin`, component: Strategies, exact: true },
      {
        path: `${PATH}/strategies-admin/detail/:id`,
        component: StrategyDetail,
        exact: true,
      },
      {
        path: `${PATH}/audit-templates-admin`,
        component: AuditTemplates,
        exact: true,
      },
      {
        path: `${PATH}/audit-templates-admin/detail/:id`,
        component: AuditTemplateDetail,
        exact: true,
      },
      { path: `${PATH}/audits-admin`, component: Audits, exact: true },
      {
        path: `${PATH}/audits-admin/detail/:id`,
        component: AuditDetail,
        exact: true,
      },
      {
        path: `${PATH}/action-plans-admin`,
        component: ActionPlans,
        exact: true,
      },
      {
        path: `${PATH}/action-plans-admin/detail/:id`,
        component: ActionPlanDetail,
        exact: true,
      },
      { path: `${PATH}/actions-admin`, component: Actions, exact: true },
      {
        path: `${PATH}/actions-admin/detail/:id`,
        component: ActionDetail,
        exact: true,
      },
      { path: '*', component: E404 },
    ],
  },
];
