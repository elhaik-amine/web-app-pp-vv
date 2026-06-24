# Khidmati 🛠️

_Marché de services à domicile — Application mobile & web_

![Expo](https://img.shields.io/badge/Expo-54-black?logo=expo)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Node](https://img.shields.io/badge/Node-18-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)
![Stripe](https://img.shields.io/badge/Stripe-test-008CDD?logo=stripe)

Application complète de mise en relation entre **clients** ayant des travaux
(plomberie, électricité, ménage, jardinage, climatisation, peinture…) et
**prestataires** qualifiés. Avec système de tokens, QR code, messagerie temps
réel et panel d'administration.

---

## 🧰 Stack technique

| Couche | Technologie |
|---|---|
| **Mobile** (client & prestataire) | React Native, Expo 54, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO |
| **Panel admin** | React 19, Vite 8, React Router |
| **Base de données** | MySQL 8 (MariaDB) |
| **Paiement** | Stripe (mode test) |
| **Auth** | JWT + bcrypt |
| **Images** | Cloudinary |

---

## ⚙️ Installation

```bash
git clone https://github.com/elhaik-amine/web-app-pp-vv.git
cd web-app-pp-vv
mysql -u root -p < init.sql

cd backend && npm install && cp .env.example .env
cd ../frontend && npm install && cp .env.example .env
cd ../admin-frontend && npm install
```

> ⚠️ Éditer `backend/.env` et `frontend/.env` avec vos clés.

---

## 🚀 Démarrage

### Terminal 1 — Backend
```bash
cd backend
npm run dev       # → http://localhost:5002
```

### Terminal 2 — Tunnel public (mobile)
```bash
ngrok http 5002
```
Copier l'URL obtenue (ex: `https://xxxx.ngrok-free.app`) dans `frontend/.env` :
```
EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app/api
```

### Terminal 3 — Mobile (Expo)
```bash
cd frontend
npx expo start -c
# Scanner le QR code avec Expo Go
```

### Terminal 4 — Panel admin (optionnel)
```bash
cd admin-frontend
npm run dev       # → http://localhost:5173
```

---

## 👤 Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@khdimati.com | `123456` |
| Client | test@client.com | `123456` |
| Prestataire | test@provider.com | `123456` |

Carte Stripe test : `4242 4242 4242 4242`

---

## 📁 Structure

```
web-app-pp-vv/
├── backend/             # API REST (Express + Socket.IO)
│   ├── src/controllers/   Logique métier
│   ├── src/routes/        Endpoints
│   ├── src/middlewares/   Auth, erreurs
│   └── tests/             Tests Jest
├── frontend/            # App mobile Expo
│   └── src/pages/
│       ├── auth/          Connexion, inscription
│       ├── client/        Écrans client
│       └── provider/      Écrans prestataire
├── admin-frontend/      # Panel admin (Vite)
│   └── src/pages/        Dashboard, utilisateurs, signalements
├── init.sql             # Base de données + données initiales
└── docker-compose.yml
```

---

## 🔄 Fonctionnement

```
Client cherche un prestataire
       ↓
Client envoie une demande (photos + description)
       ↓
Prestataire propose un prix (1 token consommé)
       ↓
Client accepte → date et créneau fixés
       ↓
Jour J → Prestataire scanne le QR code du client
       ↓
Début de la prestation
       ↓
Fin → Prestataire ajoute photos "après"
       ↓
Client note le prestataire (1–5 ⭐)
```

---

## ✨ Fonctionnalités

**Mobile** · Inscription, recherche par catégorie, demande de devis (4 étapes),
négociation du prix, QR code, photos avant/après, notation, portefeuille de
tokens, messagerie temps réel, signalements.

**Admin** · Dashboard, gestion des utilisateurs (suspendre/bannir), modération
des signalements, supervision des réservations.

---

## 👤 Auteur

**Mohammed Amine EL Haik**  
Étudiant à l'ENSET Mohammedia · Filière BBCC  
[mohammed.elhaik-etu@etu.univh2c.ma](mailto:mohammed.elhaik-etu@etu.univh2c.ma)  
[github.com/elhaik-amine](https://github.com/elhaik-amine)
