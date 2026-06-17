AGENTS.md - GrabGo

1. Contexte du projet

GrabGo est une plateforme de click & collect campus.

L’objectif est de permettre aux étudiants de commander à l’avance dans des snacks ou cafétérias proches de leur campus, puis de retirer leur commande sur place sans attendre dans la file.

Le projet ne gère pas la livraison en V1. Il se concentre uniquement sur le retrait sur place.

2. Objectif principal du code

Le code doit permettre de valider les compétences du bloc 2 du projet de fin d’études.

Il faut donc produire un prototype fonctionnel, propre, documenté, testé, sécurisé et déployable.

Le projet doit prouver les points suivants :

* environnement de développement propre
* architecture logicielle claire
* intégration continue
* tests unitaires
* sécurité
* accessibilité
* versionning
* documentation technique
* cahier de recette
* plan de correction des bugs

3. Stack technique retenue

Utiliser la stack suivante :

* Backend : NestJS
* Langage : TypeScript
* ORM : Prisma
* Base de données : PostgreSQL
* Front dashboard commerçant : React
* Application étudiant : React Native avec Expo, ou React web simulé si nécessaire
* Temps réel : WebSockets
* Tests : Jest
* Conteneurisation : Docker / Docker Compose
* CI : GitHub Actions
* Qualité : ESLint + Prettier

4. Architecture attendue

Utiliser une architecture monorepo.

Structure cible :

grabgo/
├── AGENTS.md
├── README.md
├── CHANGELOG.md
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── api/
│   ├── dashboard/
│   └── mobile/
├── packages/
│   └── shared/
├── docs/
└── .github/
    └── workflows/

Le backend doit être placé dans :

apps/api

Le dashboard commerçant doit être placé dans :

apps/dashboard

L’application étudiant doit être placée dans :

apps/mobile

Les types partagés doivent être placés dans :

packages/shared

5. Modules backend attendus

Créer une API NestJS organisée par modules métier.

Modules attendus à terme :

auth
users
campuses
merchants
snacks
products
slots
orders
payments
notifications
withdrawal

Chaque module doit être structuré proprement avec, lorsque nécessaire :

controller
service
dto
entity ou model
tests

6. Rôles utilisateurs

Prévoir au minimum trois rôles :

STUDENT
MERCHANT
ADMIN

Un étudiant peut commander.

Un commerçant peut gérer son snack, ses produits, ses slots et ses commandes.

Un admin peut superviser la plateforme.

7. Fonctionnalités V1 prioritaires

Côté étudiant

Prévoir les fonctionnalités suivantes :

* création de compte
* connexion
* sélection manuelle du campus
* consultation des snacks du campus
* consultation des produits d’un snack
* affichage des allergènes
* ajout de produits au panier
* choix d’un slot de retrait de 15 minutes
* création d’une commande
* paiement simulé ou Stripe en mode test
* génération d’un QR code de retrait
* génération d’un code de retrait à 4 chiffres
* historique des commandes
* reçu numérique simple

Côté commerçant

Prévoir les fonctionnalités suivantes :

* connexion au dashboard
* visualisation des commandes du jour
* réception des commandes en temps réel
* définition de la capacité par slot de 15 minutes
* activation du bouton Snooze 15 min
* activation du circuit breaker pour passer le snack hors ligne
* validation d’une commande par QR code
* validation fallback avec code à 4 chiffres
* recherche d’une commande par prénom ou heure de retrait
* gestion simplifiée du stock par type
* statistiques simples

8. Règles métier importantes

Slots de capacité

Le commerçant définit une capacité par tranche de 15 minutes.

Exemple :

12h00 - 12h15 : 6 commandes maximum
12h15 - 12h30 : 8 commandes maximum

Un étudiant ne peut commander que sur un slot disponible.

Un slot devient indisponible si :

* la capacité maximale est atteinte
* le snack est hors ligne
* le circuit breaker est actif
* le snooze est actif
* le mode rush masque temporairement les créneaux proches

Mode rush

Quand un slot atteint 80% de sa capacité, les créneaux des 30 prochaines minutes doivent être masqués côté étudiant.

Snooze

Le commerçant peut cliquer sur un bouton “Snooze 15 min”.

Pendant cette période, les nouvelles commandes sont temporairement bloquées.

Circuit breaker

Le commerçant peut passer son snack hors ligne instantanément en cas de problème ou de rush trop important.

Quand le circuit breaker est actif, aucune nouvelle commande ne doit être acceptée.

Pull Cooking

La préparation ne démarre pas forcément dès la commande.

Logique cible :

* à T-7 minutes, l’étudiant reçoit une notification de confirmation
* l’étudiant peut confirmer qu’il arrive
* l’étudiant peut signaler un retard
* sans confirmation à T-5 minutes, la préparation démarre automatiquement

Pour le prototype, cette logique peut être simplifiée avec des statuts de commande.

QR code et code de retrait

Chaque commande confirmée doit générer :

* un token unique pour le QR code
* un code à 4 chiffres

Le QR code est la méthode principale de retrait.

Le code à 4 chiffres est le fallback en cas de problème de scan.

Allergènes

Chaque produit peut posséder une liste d’allergènes.

Les allergènes doivent être visibles avant la validation de commande.

Côté commerçant, les modifications d’allergènes doivent pouvoir être horodatées.

8 bis. Règles techniques différées à ne pas oublier

Code de retrait à 4 chiffres

* Le code de retrait à 4 chiffres est un fallback au QR code.
* Le QR code reste l'identifiant principal et doit reposer sur WithdrawalCode.qrToken, qui est unique.
* Le code à 4 chiffres repose sur WithdrawalCode.code.
* Le code à 4 chiffres ne doit pas forcément être unique globalement dans la base, car il n'a que 10 000 possibilités.
* En revanche, il ne doit pas y avoir de collision active pour un même snack sur une même journée de service.
* Lors de la génération d'un code, vérifier qu'aucune commande active du même snack, sur la même journée, n'utilise déjà ce code.
* Les statuts considérés comme actifs sont :
  * PAID
  * CONFIRMED
  * WAITING_PULL_CONFIRMATION
  * PREPARING
  * READY
  * LATE
* Les statuts terminaux peuvent réutiliser le même code un autre jour ou après expiration :
  * COMPLETED
  * EXPIRED
  * CANCELLED
  * REFUNDED
* Le code doit être généré côté backend uniquement.
* Le code doit être composé exactement de 4 chiffres.
* Le code doit être affichable côté étudiant sous le QR code.
* Le code doit être utilisable côté dashboard commerçant comme fallback de validation.
* Le code ne doit pas être utilisé comme preuve de paiement principale.

Validation du retrait

* Lorsqu'un commerçant valide un retrait, il doit d'abord essayer de valider via le QR token.
* Si le scan échoue, il peut saisir le code à 4 chiffres.
* Si le code est utilisé, la recherche doit être limitée au snack concerné et aux commandes actives du jour.
* Une fois la commande remise, WithdrawalCode.usedAt doit être renseigné.
* Le statut de la commande doit passer à COMPLETED.
* Une notification de confirmation doit être créée pour l'étudiant.
* Une commande déjà validée ne doit pas pouvoir être validée une deuxième fois.

Slots et capacité

* Les slots sont le cœur métier de GrabGo.
* Un slot représente une tranche de 15 minutes.
* Un étudiant ne peut commander que dans un slot disponible.
* Un slot est disponible si :
  * reservedCount < capacity
  * le statut du slot est AVAILABLE
  * le snack est ONLINE
  * le circuit breaker du snack est désactivé
  * le snack n'est pas snoozed à l'instant de la commande
* Quand une commande est confirmée, reservedCount doit être incrémenté.
* Quand une commande est annulée ou remboursée avant préparation, reservedCount peut être décrémenté.
* À partir de 80% de capacité atteinte sur un slot, le mode rush doit masquer les créneaux des 30 prochaines minutes côté étudiant.
* Cette logique doit être testée avec Jest.

Paiement simulé en V1

* En V1, le paiement peut être simulé.
* Créer tout de même une entité Payment.
* Utiliser Payment.provider = "simulated" si Stripe n'est pas intégré.
* Une commande ne doit pas passer en CONFIRMED sans paiement PAID.
* Order.productsTotalCents représente le total des produits.
* Order.serviceFeeCents représente le frais de service étudiant.
* Order.totalCents représente le total payé par l'étudiant.
* En V1, Order.totalCents = Order.productsTotalCents + Order.serviceFeeCents.

Allergènes

* Les allergènes sont une exigence métier et sécurité.
* Les allergènes doivent être visibles côté étudiant avant validation de commande.
* Product.allergensVerifiedAt doit être renseigné lorsqu'un commerçant confirme que les allergènes sont à jour.
* Un produit avec allergènes non vérifiés peut rester affiché, mais l'interface doit signaler que les informations doivent être confirmées auprès du snack.
* Les modifications d'allergènes doivent être faites côté commerçant.

9. Statuts de commande

Utiliser des statuts clairs.

Statuts recommandés :

PENDING_PAYMENT
PAID
CONFIRMED
WAITING_PULL_CONFIRMATION
PREPARING
READY
COMPLETED
LATE
EXPIRED
CANCELLED
REFUNDED

10. Modèle de données minimum

Prévoir au minimum les entités suivantes :

User
Campus
Merchant
Snack
Product
ProductOption
Allergen
Slot
Order
OrderItem
Payment
Receipt
Notification
WithdrawalCode

11. Sécurité attendue

Le projet doit intégrer des bonnes pratiques de sécurité.

À prévoir :

* authentification JWT
* hash des mots de passe avec bcrypt ou argon2
* validation des données entrantes
* DTO NestJS
* guards
* rôles et permissions
* protection CORS
* Helmet
* rate limiting
* variables d’environnement
* aucun secret dans le repo
* gestion propre des erreurs
* messages d’erreur non sensibles

12. Accessibilité attendue

Le dashboard doit être simple et accessible.

À prévoir côté interface :

* labels sur les champs de formulaire
* boutons explicites
* textes d’erreur compréhensibles
* navigation clavier
* contrastes corrects
* aria-label si nécessaire
* interface lisible en situation de rush

13. Tests attendus

Créer des tests unitaires avec Jest.

Priorité absolue : tester la logique métier des slots.

Cas de test attendus :

* un slot est disponible quand la capacité n’est pas atteinte
* un slot est indisponible quand la capacité est atteinte
* un slot est masqué si le circuit breaker est actif
* un slot est masqué si le snooze est actif
* le mode rush masque les créneaux des 30 prochaines minutes
* une commande est refusée si le stock est insuffisant
* un code de retrait à 4 chiffres est généré correctement
* générer un code de retrait exactement composé de 4 chiffres
* éviter une collision de code actif pour un même snack sur une même journée
* permettre la réutilisation d'un code sur un autre jour
* valider une commande via QR token
* valider une commande via code fallback
* empêcher la validation d'une commande déjà utilisée
* vérifier que totalCents = productsTotalCents + serviceFeeCents

Les tests doivent être faciles à lancer avec une commande simple.

Exemple :

npm run test

14. Intégration continue

Prévoir GitHub Actions.

Créer le fichier :

.github/workflows/ci.yml

La CI doit lancer au minimum :

install
lint
test
build

15. Documentation attendue

Créer un dossier :

docs/

Avec les documents suivants :

docs/architecture.md
docs/deploiement-continu.md
docs/cahier-recette.md
docs/plan-correction-bugs.md
docs/manuel-deploiement.md
docs/manuel-utilisation.md
docs/manuel-mise-a-jour.md

Le README doit expliquer :

* le projet
* la stack
* l’installation
* le lancement local
* les commandes utiles
* les tests
* le lien avec les compétences du bloc 2

16. Versionning

Prévoir un fichier :

CHANGELOG.md

Utiliser une logique de versions :

v0.1.0 - Initialisation technique
v0.2.0 - Authentification et rôles
v0.3.0 - Catalogue snacks et produits
v0.4.0 - Slots et commandes
v0.5.0 - Dashboard commerçant
v0.6.0 - Tests, CI et documentation

17. Compétences du bloc 2 à prouver

C2.1.1 - Environnement de développement et qualité

Le projet doit montrer :

* un environnement de développement clair
* Docker Compose
* README
* scripts npm
* ESLint
* Prettier
* Jest
* configuration d’environnement

C2.1.2 - Intégration continue

Le projet doit montrer :

* GitHub Actions
* pipeline CI
* lint
* tests
* build
* documentation du protocole d’intégration

C2.2.1 - Prototype fonctionnel

Le projet doit montrer :

* architecture logicielle propre
* API fonctionnelle
* dashboard commerçant
* fonctionnalités métier GrabGo
* framework adapté
* structure modulaire

C2.2.2 - Tests unitaires

Le projet doit montrer :

* tests Jest
* logique métier testée
* tests sur les slots
* tests reproductibles

C2.2.3 - Sécurité et accessibilité

Le projet doit montrer :

* authentification sécurisée
* rôles
* guards
* validation des entrées
* protections HTTP
* interface accessible

C2.2.4 - Déploiement progressif et versionning

Le projet doit montrer :

* Git
* changelog
* versions progressives
* historique des évolutions
* prototype exécutable

C2.3.1 - Cahier de recette

Le projet doit montrer :

* scénarios de recette
* résultats attendus
* tests manuels documentés

C2.3.2 - Plan de correction des bugs

Le projet doit montrer :

* stratégie de correction
* priorisation des bugs
* exemples d’anomalies
* suivi des corrections

C2.4.1 - Documentation technique d’exploitation

Le projet doit montrer :

* manuel de déploiement
* manuel d’utilisation
* manuel de mise à jour
* documentation claire pour reprendre le projet

18. Ordre de développement recommandé

Ne pas développer toute l’application d’un seul coup.

Respecter cet ordre :

1. Initialiser le monorepo
2. Créer l'API NestJS
3. Configurer Prisma + PostgreSQL
4. Ajouter Docker Compose
5. Ajouter ESLint, Prettier et Jest
6. Créer le README initial
7. Créer le schéma Prisma
8. Ajouter l'authentification
9. Ajouter les rôles
10. Ajouter les campus, snacks et produits
11. Ajouter les slots
12. Ajouter les commandes
13. Ajouter les tests unitaires
14. Ajouter le dashboard commerçant
15. Ajouter les WebSockets
16. Ajouter la CI GitHub Actions
17. Ajouter la documentation technique

19. Contraintes pour l’agent de code

Toujours respecter ces règles :

* ne pas coder toute l’application en une seule réponse
* avancer étape par étape
* expliquer les fichiers créés ou modifiés
* garder une architecture simple et propre
* ne pas ajouter de fonctionnalités hors périmètre
* ne pas mettre de secrets dans le code
* utiliser TypeScript strictement
* privilégier la lisibilité
* écrire des tests dès que la logique métier existe
* documenter les commandes importantes
* ne pas supprimer un fichier existant sans raison claire
* À chaque nouvelle étape métier, vérifier les règles techniques différées de ce fichier avant de coder. Ne jamais ignorer une règle marquée comme différée sous prétexte qu'elle n'était pas nécessaire dans une étape précédente.
* Si une décision est prise pendant le développement mais doit être implémentée plus tard, l’ajouter immédiatement dans la section "Règles techniques différées à ne pas oublier" de AGENTS.md avant de continuer.

20. État actuel du développement

Les étapes suivantes sont déjà réalisées :

* Étape 1 : initialisation technique du monorepo
* Étape 2 : création du schéma Prisma métier minimum
* Ajout des règles techniques différées dans AGENTS.md

La prochaine étape recommandée est :

* Créer la première migration Prisma à partir du schéma existant.
