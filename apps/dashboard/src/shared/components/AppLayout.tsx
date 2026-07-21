import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { Button } from './Button';

export function AppLayout() {
  const { session, signOut } = useAuth();
  const userName = session?.user.firstName ?? 'Commerçant';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">GrabGo</p>
          <h1>Dashboard commerçant</h1>
        </div>
        <div className="user-menu" aria-label="Session utilisateur">
          <span>{userName}</span>
          <Button variant="ghost" onClick={signOut}>
            Se déconnecter
          </Button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar" aria-label="Navigation principale">
          <NavLink to="/orders">Commandes</NavLink>
          <NavLink to="/dashboard">Synthèse</NavLink>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
