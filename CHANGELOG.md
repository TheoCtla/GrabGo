# Changelog

Ce document retrace les principales évolutions du projet GrabGo à partir
de l'historique Git du dépôt.

Les applications et packages du monorepo déclarent actuellement la version
`0.1.0`.

La version `0.1.0` constitue la première release formelle préparée du projet.
Elle correspond à l'état actuel validé du prototype.

## [Unreleased]

## [0.1.0] - 2026-08-18

### Ajouté

- Mise en place de sondes de supervision de l'API :
  - `/api/health/live` pour vérifier que l'application répond ;
  - `/api/health/ready` pour vérifier également la disponibilité de PostgreSQL.
- Ajout d'un healthcheck Docker pour l'API.
- Ajout de la journalisation des requêtes HTTP avec méthode, URL, statut HTTP
  et durée de traitement.
- Ajout de l'audit de sécurité npm dans la CI avec blocage en présence d'une
  vulnérabilité critique.
- Ajout de Dependabot pour proposer automatiquement des mises à jour npm
  hebdomadaires.
- Protection de la pile mobile dans Dependabot afin d'éviter les mises à jour
  automatiques d'Expo, React Native, React et React DOM.

### Corrigé

- Correction de la gestion du stock lors de la création d'une commande :
  - refus d'une quantité supérieure au stock disponible ;
  - refus d'un produit dont le stock est insuffisant ;
  - agrégation des quantités demandées pour un même produit ;
  - décrément atomique et conditionnel du stock dans la transaction Prisma ;
  - protection contre les commandes concurrentes ;
  - absence de création de commande lorsque le stock n'est plus disponible ;
  - rollback transactionnel en cas d'échec.
- Ajout de tests couvrant une commande avec un stock suffisant, le décrément
  correct du stock, une quantité supérieure au stock, un stock nul et un échec
  concurrent simulé par `updateMany()` retournant `count: 0`.
- Le nombre de tests API passe de 157 à 162.

### Modifié

- React Router mis à jour de `7.18.1` vers `7.18.2`.
- Arbre de dépendances React corrigé afin de conserver React et React DOM
  `19.1.0`.
- Plusieurs dépendances transitives ont reçu des correctifs compatibles :
  `brace-expansion`, `fast-uri`, `js-yaml`, `nanoid` et `undici`.

### Sécurité

- Mise en place d'une vérification `npm audit --audit-level=critical` dans
  GitHub Actions.
- Les vulnérabilités modérées ou élevées restent visibles dans l'audit mais
  ne bloquent pas actuellement la CI.
- Les mises à jour nécessitant une migration majeure de la pile mobile ne
  sont pas appliquées automatiquement.

### Commits associés

- `9245bc7` - feat(api): add health monitoring and HTTP logging
- `86497b2` - fix(deps): align React and apply security patches
- `bf60500` - ci: add critical npm security audit
- `627d969` - ci(deps): configure Dependabot updates
- `a4d99aa` - style(ci): format Dependabot configuration
- `be009ec` - fix(api): enforce product stock on order creation

---

## 2026-07-24

### Corrigé

- Amélioration de l'affichage du détail d'une commande dans le dashboard
  commerçant.
- Correction de l'affichage des actions du panier dans l'application mobile
  afin qu'elles restent accessibles.

### Commits associés

- `659cdb1` - fix(dashboard): improve merchant order detail layout
- `fcea98f` - fix(mobile): keep cart actions visible

---

## 2026-07-23

### Ajouté

- Mise en place du workflow GitHub Actions de contrôle qualité.
- Les étapes de contrôle automatisées couvrent notamment le formatage,
  le lint, les tests et le build.

### Corrigé

- Stabilisation du bundling Metro de l'application mobile dans le monorepo.

### Modifié

- Remplacement des identifiants de démonstration utilisés par le seed.

### Commits associés

- `da6aed3` - ci: add quality checks workflow
- `913435e` - chore(seed): replace default demo credentials
- `3379088` - fix(mobile): stabilize Expo Metro monorepo bundling

---

## 2026-07-22

### Ajouté

- Ajout de l'inscription étudiant.
- Amélioration de l'interface du dashboard commerçant.
- Ajout de métriques de synthèse dans le dashboard.
- Seed automatique de l'API au démarrage du conteneur Docker.

### Modifié

- Alignement de la pile Expo pour les tests sur appareil physique.
- Application d'un thème sombre accessible sur l'application mobile.

### Corrigé

- Adaptation des tests des composants de commandes du dashboard après
  l'alignement de React.

### Commits associés

- `ad2e43c` - feat(auth): add student registration flow
- `29c3b4e` - chore(mobile): align Expo SDK for physical device testing
- `0df2093` - style(mobile): apply accessible dark theme
- `0a1dd77` - test(dashboard): fix order component tests after React alignment
- `3a5deb5` - feat(dashboard): polish merchant UI and summary metrics
- `4747ffe` - chore(docker): seed API container on startup

---

## 2026-07-21

### Ajouté

- Initialisation de l'architecture du dashboard commerçant.
- Ajout de la gestion des commandes côté commerçant.
- Initialisation du catalogue dans l'application mobile étudiant.
- Ajout du parcours de commande étudiant sur mobile.

### Amélioré

- Amélioration du workflow de gestion des commandes dans le dashboard.
- Génération de nouveaux créneaux de démonstration dans le seed API.

### Commits associés

- `5774b8b` - feat(dashboard): initialize merchant dashboard architecture
- `25bf5ba` - feat(dashboard): add merchant order management
- `6218d41` - feat(mobile): initialize student app catalog
- `08f4775` - feat(mobile): add student order flow
- `7ca1dec` - feat(dashboard): improve merchant orders workflow
- `c993cca` - chore(api): generate fresh seed slots

---

## 2026-07-07

### Ajouté

- Mise en place de la configuration Docker Compose du backend.

### Commit associé

- `c0b97e4` - chore(docker): add full backend compose setup

---

## 2026-07-06

### Corrigé

- Correction des filtres utilisés pour la liste des commandes commerçant.
- Harmonisation du filtrage avec la relation Prisma du commerçant.
- Suppression du filtrage implicite sur la journée lorsqu'aucune période
  n'est explicitement demandée.
- Ajout de tests de non-régression afin de vérifier notamment qu'une commande
  accessible en détail reste également présente dans la liste du commerçant.

### Commit associé

- `538be1f` - fix(orders): correct merchant order listing filters

---

## 2026-06-28

### Ajouté

- Ajout d'un seed de développement pour faciliter l'initialisation et les
  tests locaux de l'API.

### Commit associé

- `7b8f9b6` - chore(api): add development seed

---

## 2026-06-24

### Ajouté

- Consultation de l'historique des commandes étudiant.
- Consultation du détail d'une commande.
- Liste des commandes destinée au commerçant.

### Refactorisé

Le domaine des commandes a été séparé en plusieurs services spécialisés :

- lecture des commandes ;
- changement de statut commerçant ;
- génération du code de retrait ;
- validation du retrait ;
- paiement simulé ;
- création de commande ;
- centralisation des statuts actifs de retrait.

Cette séparation réduit les responsabilités portées par le service principal
des commandes et améliore la maintenabilité du backend.

### Commits associés

- `09f4cf9` - feat(orders): add merchant order listing
- `4bf604d` - feat(orders): add student order history
- `a2508a4` - feat(orders): add order detail access
- `9cf7534` - refactor(orders): extract order read services
- `7c83fc1` - refactor(orders): extract merchant status service
- `68c21ea` - refactor(orders): extract withdrawal code service
- `1e17607` - refactor(orders): extract withdrawal validation service
- `c1aefe4` - refactor(orders): extract simulated payment service
- `dfe2c35` - refactor(orders): extract order creation service
- `6743f85` - refactor(orders): centralize active withdrawal statuses

---

## 2026-06-23

### Ajouté

- Génération d'un code de retrait après paiement.
- Validation du retrait par QR code ou code de retrait.
- Modification du statut des commandes par le commerçant.

### Tests

- Ajout de tests automatisés couvrant le parcours de validation du retrait.

### Commits associés

- `9b11384` - feat(orders): generate withdrawal codes after payment
- `018b9be` - feat(orders): validate withdrawal by QR or pickup code
- `e409293` - test(orders): cover withdrawal validation flow
- `376eb4d` - feat(orders): add merchant order status updates

---

## 2026-06-22

### Ajouté

- Mise en place de l'authentification.
- Gestion de la disponibilité des créneaux de retrait.
- Création du parcours de commande étudiant.
- Ajout du paiement simulé.

### Commits associés

- `107f70f` - auth done
- `88a8047` - feat(slots): add pickup slot availability logic
- `5f6b42c` - feat(orders): add student order and simulated payment flow

---

## 2026-06-17

### Ajouté

- Initialisation du monorepo GrabGo.
- Mise en place des premières briques Prisma et du script associé.

### Commit associé

- `55027b7` - initialisation monorepo & création script prisma

---

## 2026-06-16

### Ajouté

- Initialisation du dépôt GrabGo.

### Commit associé

- `5b21a8c` - Initial commit

---

## Politique de versionnement

La version `0.1.0` est la première release formelle préparée de GrabGo. Elle
correspond à l'état actuel validé du prototype.

Les anciennes étapes chronologiques du développement ne sont pas considérées
comme des releases. Elles restent documentées comme des jalons identifiables
dans l'historique Git.

Pour les futures versions de GrabGo, la procédure de release continuera à
s'appuyer sur :

1. un état du projet validé par les contrôles qualité ;
2. un commit identifié ;
3. une mise à jour de ce changelog ;
4. un tag Git correspondant à la version publiée ;
5. éventuellement une GitHub Release basée sur ce même tag.

Les futures versions pourront suivre le principe de versionnement sémantique :

- `PATCH` : correction compatible sans nouvelle fonctionnalité majeure ;
- `MINOR` : ajout fonctionnel rétrocompatible ;
- `MAJOR` : modification incompatible nécessitant une migration.
