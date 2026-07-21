# GrabGo Mobile

Application etudiant Expo pour consulter les campus, snacks, produits et creneaux
disponibles.

## Lancement

```bash
npm run dev -w apps/mobile
```

## API

La variable `EXPO_PUBLIC_API_BASE_URL` pointe par defaut vers :

```text
http://localhost:3000/api
```

Sur simulateur iOS, `localhost` peut fonctionner selon le contexte. Sur un appareil
physique, utilisez l'adresse IP locale de la machine qui lance le backend, par exemple :

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000/api
```

Ne versionnez pas `apps/mobile/.env`.
