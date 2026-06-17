# GrabGo

GrabGo est une plateforme de click & collect campus. Le prototype doit permettre a des
etudiants de commander a l'avance dans des snacks ou cafeterias proches de leur campus,
puis de retirer leur commande sur place sans attendre dans la file.

Cette premiere version initialise uniquement la base technique du projet. Les
fonctionnalites metier comme l'authentification, les commandes, les slots, le dashboard
commercant et l'application mobile seront ajoutees par etapes.

## Stack

- Backend : NestJS avec TypeScript
- ORM : Prisma
- Base de donnees : PostgreSQL
- Tests : Jest
- Qualite : ESLint et Prettier
- Conteneurisation : Docker Compose
- Monorepo : npm workspaces

## Structure

```text
grabgo/
├── apps/
│   ├── api/
│   ├── dashboard/
│   └── mobile/
├── packages/
│   └── shared/
├── docs/
├── docker-compose.yml
├── package.json
└── tsconfig.base.json
```

## Installation

Pre-requis :

- Node.js 22+
- npm 10+
- Docker et Docker Compose

Installer les dependances :

```bash
npm install
```

Copier les variables d'environnement :

```bash
cp .env.example .env
```

Demarrer PostgreSQL :

```bash
docker compose up -d
```

Generer le client Prisma :

```bash
npm run prisma:generate -w apps/api
```

## Lancement local

Demarrer l'API NestJS en mode developpement :

```bash
npm run dev
```

L'API expose pour l'instant un endpoint technique :

```text
GET http://localhost:3000/
```

## Commandes utiles

```bash
npm run build
npm run lint
npm run format
npm run format:check
npm run test
npm run prisma:migrate -w apps/api
```

## Tests

Les tests unitaires sont lances avec Jest :

```bash
npm run test
```

La logique metier des slots sera testee en priorite lorsqu'elle sera implementee.

## Lien avec les competences du bloc 2

- C2.1.1 : environnement de developpement, Docker Compose, scripts npm, TypeScript,
  ESLint, Prettier, Jest et variables d'environnement.
- C2.1.2 : la CI GitHub Actions sera ajoutee dans une etape dediee.
- C2.2.1 : structure monorepo et API NestJS initialisee.
- C2.2.2 : socle Jest pret pour les tests unitaires.
- C2.2.3 : les bases de configuration sont preparees, les mecanismes de securite et
  d'accessibilite seront ajoutes avec les modules concernes.
- C2.2.4 : version v0.1.0 documentee dans le changelog.
- C2.3.1, C2.3.2 et C2.4.1 : dossier `docs/` prepare pour les documents de recette,
  correction de bugs et exploitation.
