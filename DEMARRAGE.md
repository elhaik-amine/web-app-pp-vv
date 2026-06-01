# Guide de démarrage Khidmati

## À faire à chaque fois

### 1. Backend
```bash
cd ~/Bureau/khidma/web-app-pp-v1/backend
npm run dev
```

### 2. Ngrok (tunnel public)
```bash
ngrok http 5002
```
→ Note l'URL : `https://xxxx.ngrok-free.app`

### 3. Modifier le fichier frontend/.env
Ouvre `frontend/.env` et remplace l'URL par la nouvelle :

```
EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app/api
```

### 4. Frontend Expo
```bash
cd ~/Bureau/khidma/web-app-pp-v1/frontend
npx expo start --clear
```

### 5. Admin (optionnel)
```bash
cd ~/Bureau/khidma/web-app-pp-v1/admin-frontend
npm run dev
```
→ Admin accessible sur `http://localhost:5174`

## Ordre à respecter
1. Backend (port 5002)
2. Ngrok (récupère l'URL)
3. Mets l'URL dans `frontend/.env`
4. Expo (scanne le QR avec le téléphone)

## Rappel
- Les 3 comptes test : `test@client.com`, `test@provider.com`, `admin@khdimati.com`
- Mot de passe : `123456`
- Stripe en mode test : carte `4242 4242 4242 4242`
