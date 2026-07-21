import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardHomePage } from '../features/dashboard/pages/DashboardHomePage';
import { MerchantOrdersPage } from '../features/orders/pages/MerchantOrdersPage';
import { AppLayout } from '../shared/components/AppLayout';
import { ErrorState } from '../shared/components/ErrorState';
import { ProtectedRoute } from '../shared/auth/auth-context';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/orders" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardHomePage />
      },
      {
        path: 'orders',
        element: <MerchantOrdersPage />
      }
    ]
  },
  {
    path: '*',
    element: (
      <main className="not-found" aria-labelledby="not-found-title">
        <ErrorState
          title="Page introuvable"
          message="La page demandée n'existe pas dans le dashboard GrabGo."
          actionLabel="Retour aux commandes"
          actionHref="/orders"
        />
      </main>
    )
  }
]);
