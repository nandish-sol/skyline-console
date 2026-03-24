import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Credentials from '../containers/Credentials';
import UserCenter from '../containers/UserCenter';
import ProfileSettings from '../containers/ProfileSettings';

const PATH = '/user';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      {
        path: `${PATH}/center`,
        component: UserCenter,
        exact: true,
      },
      {
        path: `${PATH}/settings`,
        component: ProfileSettings,
        exact: true,
      },
      {
        path: `${PATH}/application-credentials`,
        component: Credentials,
        exact: true,
      },
      { path: '*', component: E404 },
    ],
  },
];
