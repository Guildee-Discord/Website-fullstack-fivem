# 🌐 Website FiveM — Discord OAuth + Express + MySQL (EJS)

Template public pour un **vrai site web** (pages EJS) connecté à une base FiveM **existante** :
- Express.js + EJS
- Auth Discord (Passport)
- MySQL via **une seule URL** dans `config.json` (style FiveM)
- Tailwind via **cdnjs**
- **On ne touche pas** à `users.identifier` (in-game)
- Liaison Discord ↔ FiveM via une table dédiée `user_discord`
- Redirect après login:
  - déjà lié → `/dashboard`
  - pas lié → `/link`

## Installation
```bash
npm install
cp config.json.example config.json
```

## SQL
```bash
mysql -u root -p NOM_DB < sql/user_discord.sql
```

## Lancer
```bash
npm run start
# ou
npm run dev
```

## Routes utiles
- `/` accueil
- `/login` connexion Discord
- `/dashboard` dashboard (protégé, nécessite un compte lié)
- `/link` formulaire de liaison (démo simple)
- `/logout` déconnexion

> En prod, préfère un **code de liaison généré en jeu** plutôt qu'un champ `identifier` à coller.
