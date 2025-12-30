# 🌐 Guildee — Website FiveM connecté à Discord

<p align="center">
  <img src="https://i.postimg.cc/vBNj3TbR/logo.png" width="140" alt="Guildee logo"/>
</p>

<p align="center">
  <b>Site web moderne pour serveur FiveM avec authentification Discord et base MySQL existante.</b><br>
  Express · EJS · Passport · Discord OAuth · Tailwind CDN
</p>

---

## ✨ Pourquoi Guildee

Ce template n’est pas un “site vitrine”.  
Il est pensé pour s’imbriquer proprement dans un serveur FiveM déjà en production.

- Pas de refonte de ta base  
- Pas de modification de `users.identifier`  
- Pas de scripts lourds côté client  
- Pas de dépendance inutile  

Juste une passerelle fiable entre ton jeu, ton Discord et ton site.

---

## 🧩 Fonctionnalités

| Fonction | Description |
|--------|-------------|
| 🔐 Auth Discord | Connexion OAuth via Passport |
| 🔗 Liaison FiveM | Table dédiée `user_discord` sans toucher aux tables existantes |
| 🧠 Logique de redirection | Compte déjà lié → `/dashboard`<br>Compte non lié → `/link` |
| 🛢 MySQL unique | Connexion via une seule URL (format FiveM) |
| 🎨 Thème dynamique | Couleurs & visuels configurables via `website.json` |
| ⚡ Tailwind CDN | Aucun build, tout fonctionne out-of-the-box |
| 🧱 EJS réel | Pas un SPA, de vraies pages serveur |

---

## 🚀 Installation

```bash
npm install
cp config.json.example config.json