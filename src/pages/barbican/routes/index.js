import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Secrets from '../containers/Secrets';
import SecretDetail from '../containers/Secrets/Detail';
import Containers from '../containers/Containers';
import ContainerDetail from '../containers/Containers/Detail';

const PATH = '/key-manager';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/secrets`, component: Secrets, exact: true },
      {
        path: `${PATH}/secrets/detail/:id`,
        component: SecretDetail,
        exact: true,
      },
      { path: `${PATH}/containers`, component: Containers, exact: true },
      {
        path: `${PATH}/containers/detail/:id`,
        component: ContainerDetail,
        exact: true,
      },
      { path: '*', component: E404 },
    ],
  },
];
