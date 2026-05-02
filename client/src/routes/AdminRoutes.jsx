// ==============================|| src/routes/AdminRoutes.jsx ||============================== //

import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedRoute from './ProtectedRoute';

// admin pages
const UsersPage = Loadable(lazy(() => import('views/admin/Users')));
const ClientsPage = Loadable(lazy(() => import('views/admin/Clients')));
// const TemplatesPage = Loadable(lazy(() => import('views/admin/Templates')));
// const ReportTypesPage = Loadable(lazy(() => import('views/admin/ReportTypes')));

const AdminRoutes = {
  path: '/admin',
  element: (
    <ProtectedRoute roles={['admin', 'manager', 'analyst']}>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: 'users',
      element: (
        <ProtectedRoute roles={['admin']}>
          <UsersPage />
        </ProtectedRoute>
      )
    },
    // {
    //   path: 'clients',
    //   element: (
    //     <ProtectedRoute roles={['admin', 'manager']}>
    //       <ClientsPage />
    //     </ProtectedRoute>
    //   )
    // },
    // {
    //   path: 'templates',
    //   element: (
    //     <ProtectedRoute roles={['admin', 'analyst']}>
    //       <TemplatesPage />
    //     </ProtectedRoute>
    //   )
    // },
    // {
    //   path: 'report-types',
    //   element: (
    //     <ProtectedRoute roles={['admin']}>
    //       <ReportTypesPage />
    //     </ProtectedRoute>
    //   )
    // }
  ]
};

export default AdminRoutes;