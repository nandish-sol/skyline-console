import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Secrets from '../containers/Secrets';
import Containers from '../containers/Containers';

const PATH = '/key-manager';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/secrets`, component: Secrets, exact: true },
      { path: `${PATH}/containers`, component: Containers, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
