# 🌐 Discord OAuth + Express + MySQL  
### Template Web connecté à une base FiveM existante

Template minimaliste pour créer un site web connecté à une base **FiveM déjà en production**, sans toucher à l’architecture existante.

Ce projet utilise :

- **Express.js**  
- **Authentification Discord** (Passport)  
- **MySQL via une seule URL** (format FiveM)  
- **HTML + Tailwind**  
- **INSERT uniquement** : jamais de modification automatique de données existantes  

---

## 🎯 Objectif

Relier proprement un site web à une base de données FiveM sans casser les données du serveur.

Fonctionnement :

1. L’utilisateur se connecte via Discord  
2. Le système vérifie si `discord_id` existe déjà  
3. Si l’utilisateur n’existe pas → création avec `INSERT`  
4. Sinon → lecture seule, aucune mise à jour  

La base FiveM reste souveraine.

---

## 📁 Structure du projet

```
.
├── public/
│   ├── index.html
│   └── dashboard.html
├── src/
│   ├── auth/
│   │   └── discord.js
│   ├── models/
│   │   └── user.js
│   ├── routes/
│   │   └── index.js
│   ├── db.js
│   └── config.js
├── config.json.example
├── server.js
└── package.json
```

---

## ⚙️ Installation

```bash
npm install
cp config.json.example config.json
```

---

## 🔑 Configuration

```json
{
  "port": 3000,
  "baseUrl": "http://localhost:3000",
  "sessionSecret": "change-moi-avec-une-longue-phrase",
  "discord": {
    "clientID": "TON_CLIENT_ID",
    "clientSecret": "TON_CLIENT_SECRET",
    "callbackURL": "http://localhost:3000/auth/discord/callback",
    "scope": ["identify"]
  },
  "mysqlUrl": "mysql://USER:PASSWORD@HOST:3306/NOM_DB"
}
```

---

## 🗃️ Table requise

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  discord_id VARCHAR(32) NOT NULL,
  username VARCHAR(100) NOT NULL,
  avatar VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_discord_id (discord_id)
);
```

---

## ▶️ Lancer le projet

```bash
npm run start
# ou
npm run dev
```

---

## 🔐 Sécurité & philosophie

- Aucun `UPDATE` automatique  
- Seulement `SELECT` + `INSERT`  
- Aucune donnée FiveM n’est écrasée  
- `config.json` ignoré par git