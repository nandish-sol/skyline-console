import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import SystemInfo from 'pages/management/containers/SystemInfo';
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
import ActionDetail from "../containers/Actions/Detail";
import UISettings from "../containers/UISettings";

const PATH = '/infra-optim';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/goals`, component: Goals, exact: true },
      {
        path: `${PATH}/goals/detail/:id`,
        component: GoalDetail,
        exact: true,
      },
      { path: `${PATH}/strategies`, component: Strategies, exact: true },
      {
        path: `${PATH}/strategies/detail/:id`,
        component: StrategyDetail,
        exact: true,
      },
      {
        path: `${PATH}/audit-templates`,
        component: AuditTemplates,
        exact: true,
      },
      {
        path: `${PATH}/audit-templates/detail/:id`,
        component: AuditTemplateDetail,
        exact: true,
      },
      { path: `${PATH}/audits`, component: Audits, exact: true },
      {
        path: `${PATH}/audits/detail/:id`,
        component: AuditDetail,
        exact: true,
      },
      { path: `${PATH}/action-plans`, component: ActionPlans, exact: true },
      {
        path: `${PATH}/action-plans/detail/:id`,
        component: ActionPlanDetail,
        exact: true,
      },
      { path: `${PATH}/actions`, component: Actions, exact: true },
      {
        path: `${PATH}/actions/detail/:id`,
        component: ActionDetail,
        exact: true,
      },
      { path: `${PATH}/ui-settings`, component: UISettings, exact: true },
      { path: `${PATH}/system-info`, component: SystemInfo, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
