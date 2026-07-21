import { Card } from '../../../shared/components/Card';

export function DashboardHomePage() {
  return (
    <section className="page-section" aria-labelledby="dashboard-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Synthèse</p>
          <h2 id="dashboard-title">Pilotage du snack</h2>
        </div>
      </div>
      <div className="summary-grid">
        <Card>
          <h3>Commandes du jour</h3>
          <p className="metric">Bientôt</p>
          <p className="muted">Bloc prêt pour les statistiques commerçant.</p>
        </Card>
        <Card>
          <h3>Capacite slots</h3>
          <p className="metric">Bientôt</p>
          <p className="muted">
            La gestion des slots sera branchee sur l'API dans une prochaine etape.
          </p>
        </Card>
      </div>
    </section>
  );
}
