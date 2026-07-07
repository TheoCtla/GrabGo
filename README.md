# GrabGo

GrabGo est une plateforme de click & collect campus. Elle permet aux etudiants de
commander a l'avance dans un snack proche de leur campus, puis de retirer leur commande
sur place sans attendre dans la file.

Le backend V1 est fonctionnel pour le parcours principal :

- profil etudiant : inscription, connexion, consultation campus/snacks/produits, slots,
  commande, paiement simule, suivi et historique ;
- profil commercant : connexion, liste et detail des commandes, transitions de statut,
  validation du retrait par QR token ou code a 4 chiffres.

## Fonctionnalites Backend Disponibles

- Authentification JWT avec roles `STUDENT`, `MERCHANT` et `ADMIN`.
- Consultation des campus, snacks et produits.
- Gestion des slots de retrait de 15 minutes.
- Creation de commandes avec calcul `productsTotalCents + serviceFeeCents = totalCents`.
- Paiement simule et confirmation de commande.
- Generation de QR token et code de retrait a 4 chiffres.
- Suivi et historique des commandes etudiant.
- Liste, detail et mise a jour des commandes commercant.
- Validation du retrait par QR token, avec fallback code.
- Seed de demonstration pour tests manuels et soutenance.

## Stack Technique

- NestJS et TypeScript.
- Prisma et PostgreSQL.
- Docker Compose.
- Jest.
- ESLint et Prettier.
- npm workspaces.

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

## Prerequis

- Node.js 22+.
- npm 10+.
- Docker et Docker Compose.

## Lancement Local En Developpement

Copier les variables d'environnement :

```bash
cp .env.example .env
```

Installer les dependances :

```bash
npm install
```

Lancer PostgreSQL uniquement :

```bash
docker compose up -d postgres
```

Appliquer les migrations Prisma :

```bash
npm run prisma:migrate -w apps/api
```

Charger les donnees de demonstration :

```bash
npm run prisma:seed -w apps/api
```

Lancer l'API NestJS en mode developpement :

```bash
npm run dev
```

L'API est disponible sur :

```text
http://localhost:3000/api
```

## Lancement Complet Avec Docker Compose

Copier les variables d'environnement si ce n'est pas deja fait :

```bash
cp .env.example .env
```

Lancer PostgreSQL et l'API :

```bash
docker compose up --build
```

Equivalent via script npm :

```bash
npm run docker:up
```

Le service `api` attend que PostgreSQL soit healthy, applique les migrations avec
`prisma migrate deploy`, puis demarre NestJS sur :

```text
http://localhost:3000/api
```

Le seed n'est pas automatise au demarrage du conteneur pour eviter de modifier les
donnees a chaque lancement. Pour charger les donnees de demonstration dans la base
Docker :

```bash
docker compose exec api npm run prisma:seed -w apps/api
```

Voir les logs :

```bash
docker compose logs -f
```

Arreter les conteneurs :

```bash
docker compose down
```

Lister les conteneurs :

```bash
docker compose ps
```

## Variables D'environnement

Les variables sont documentees dans `.env.example`.

- `PORT` : port HTTP utilise par NestJS. Par defaut `3000`.
- `CORS_ORIGIN` : origine autorisee pour les clients web.
- `DATABASE_URL` : URL PostgreSQL utilisee par Prisma.
- `JWT_SECRET` : secret de signature JWT. A remplacer hors demonstration.
- `JWT_EXPIRES_IN` : duree de validite des JWT, par exemple `1h`.
- `POSTGRES_DB` : nom de la base PostgreSQL.
- `POSTGRES_USER` : utilisateur PostgreSQL.
- `POSTGRES_PASSWORD` : mot de passe PostgreSQL.

En local depuis l'hote, `DATABASE_URL` pointe vers `localhost` :

```text
postgresql://grabgo:grabgo_password@localhost:5432/grabgo?schema=public
```

Dans Docker Compose, l'API utilise le nom de service `postgres` :

```text
postgresql://grabgo:grabgo_password@postgres:5432/grabgo?schema=public
```

Ne versionnez jamais les vrais fichiers `.env`.

## Commandes Utiles

Qualite et verification locale :

```bash
npm run format:check
npm run lint
npm run test
npm run build
```

Prisma :

```bash
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
```

Docker :

```bash
npm run docker:up
npm run docker:logs
npm run docker:ps
npm run docker:down
```

## Donnees De Demonstration

Le seed Prisma cree des donnees idempotentes pour les tests manuels :

- etudiant : `student.test@grabgo.local` / `Password123!`
- commercant : `merchant.test@grabgo.local` / `Password123!`
- campus de demonstration ;
- snack en ligne ;
- produits disponibles ;
- slots disponibles.

Ces identifiants sont des comptes de demonstration locaux, pas des secrets reels.

## Docker Et Reproductibilite

Docker Compose fournit un environnement backend reproductible :

- PostgreSQL isole dans le service `postgres`.
- Volume persistant `postgres_data`.
- Healthcheck `pg_isready` avant demarrage de l'API.
- API NestJS construite depuis `apps/api/Dockerfile`.
- Connexion interne Docker via `postgres:5432`.
- Migrations Prisma appliquees au demarrage du conteneur API.

Ce fonctionnement permet de demontrer un backend complet en soutenance tout en
conservant le workflow local `docker compose up -d postgres` + `npm run dev`.

## Depannage

Port `5432` deja utilise :

```bash
docker compose ps
```

Arretez l'autre PostgreSQL local, ou changez temporairement le mapping de port dans
`docker-compose.yml`.

Erreur Prisma `P1001` :

- verifiez que PostgreSQL est lance avec `docker compose ps` ;
- en local, verifiez que `DATABASE_URL` utilise `localhost` ;
- dans Docker, verifiez que l'API utilise `postgres`.

Base vide :

```bash
npm run prisma:seed -w apps/api
```

Base Docker vide :

```bash
docker compose exec api npm run prisma:seed -w apps/api
```

Token expire :

- reconnectez-vous via la route de login ;
- verifiez `JWT_EXPIRES_IN`.

Relancer proprement les conteneurs :

```bash
docker compose down
docker compose up --build
```

Reset complet du volume PostgreSQL Docker, uniquement si vous acceptez de supprimer les
donnees locales :

```bash
docker compose down -v
docker compose up --build
```

## Lien Avec Les Competences Du Bloc 2

- C2.1.1 : environnement de developpement, Docker Compose, scripts npm, TypeScript,
  ESLint, Prettier, Jest et variables d'environnement.
- C2.1.2 : pipeline CI GitHub Actions avec installation, lint, tests et build.
- C2.2.1 : prototype backend fonctionnel en architecture monorepo.
- C2.2.2 : tests unitaires Jest sur les regles metier critiques.
- C2.2.3 : authentification JWT, roles, guards, validation DTO, Helmet, CORS et rate
  limiting.
- C2.2.4 : changelog et versions progressives du prototype.
- C2.3.1 : scenarios de recette documentables depuis le seed de demonstration.
- C2.3.2 : plan de correction des bugs dans `docs/`.
- C2.4.1 : documentation d'exploitation et lancement reproductible Docker.
