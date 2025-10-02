# 📱 My Spotify

Une mini-application web légère développée en JavaScript natif avec Vite pour visualiser et gérer votre profil utilisateur.

## 🚀 Fonctionnalités

- Visualisation du profil en temps réel
- Performance optimisée avec Vite

## 🛠️ Technologies utilisées

- **JavaScript natif** (Vanilla JS)
- **Vite** - Build tool ultra-rapide
- **HTML5 & CSS3**
- **Spotify Web API** - Pour récupérer les données de profil

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (version 22 ou supérieure)
- npm ou yarn
- Un compte Spotify (gratuit ou premium)

## 🔧 Installation

### Option 1 : Version avec données statiques (branche `static-data`)

Si vous êtes sur la branche `static-data`, aucune configuration Spotify n'est nécessaire. Cette version utilise des données de démonstration.

```bash
   git clone git@github.com:WilliamBanas/my-spotify.git

   cd my-spotify

   code .

   git checkout static-data

   cd spotify-profile

   npm run dev
```

### Option 2 : Version avec les données récupérées depuis l'API web Spotify branche `main`)
### 1. Configuration Spotify Dashboard

⚠️ **Important** : Cette étape est nécessaire car Spotify a modifié sa politique. Depuis le 15 mai 2025 :
> "Please note that as of May 15th 2025, Spotify only accepts applications only from organizations (not individuals)."

Cela signifie que votre application restera en mode "Development" avec un quota limité à 25 utilisateurs.

#### Étapes de configuration :

1. Rendez-vous sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Connectez-vous avec votre compte Spotify
3. Cliquez sur **"Create app"**
4. Remplissez les informations :
   - **App name** : Nom de votre application
   - **App description** : Description de votre app
   - **Redirect URI** : `http://127.0.0.1:5173/callback` (pour le développement)
   - **API/SDKs** : Cochez "Web API"
5. Acceptez les conditions et cliquez sur **"Save"**
6. Dans les paramètres de l'application, notez :
   - **Client ID** (vous en aurez besoin pour le fichier `.env`)
7. Ajoutez les utilisateurs autorisés :
   - Allez dans l'onglet **"User Management"** de votre app
   - Cliquez sur **"Add new user"**
   - Entrez le **nom** et **l'email Spotify** de chaque utilisateur qui doit accéder à l'application
   - ⚠️ **Cette étape est obligatoire** : seuls les utilisateurs ajoutés ici pourront se connecter à votre application

### 2. Clonez le dépôt

```bash
git clone git@github.com:WilliamBanas/my-spotify.git

cd my-spotify

code .
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine du projet (dans le dossier /spotify-profile) avec les variables suivantes :

```env
VITE_SPOTIFY_CLIENT_ID=votre_client_id_spotify
VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
```

**Comment obtenir ces valeurs :**
- `VITE_SPOTIFY_CLIENT_ID` : Récupérez-le depuis votre application dans le Spotify Developer Dashboard
- `VITE_REDIRECT_URI` : URL de redirection après authentification (doit correspondre à celle configurée dans le dashboard)

> ⚠️ **Important** : Ne commitez jamais votre fichier `.env` ! Ajoutez-le à votre `.gitignore`

### 4. Installez les dépendances

```bash
cd spotify-profile

npm install
```

## 🎯 Commandes disponibles

### Mode développement
Lance le serveur de développement avec hot reload :
```bash
npm run dev
```
L'application sera accessible à l'adresse `http://localhost:5173`


## 📁 Structure du projet

```
.
├── index.html         # Point d'entrée HTML
├── src/
│   ├── index.js       # Point d'entrée JavaScript
│   ├── css/           # Styles CSS
├── public/            # Assets statiques
├── package.json       # Dépendances et scripts
```

## 🎨 Personnalisation

Vous pouvez personnaliser l'application en modifiant :
- Les styles dans `src/css/index.css`
- La logique JavaScript dans `src/index.js`
- La structure HTML dans `index.html`

## 🚀 Déploiement

Après avoir exécuté `npm run build`, le dossier `dist/` contient tous les fichiers statiques prêts à être déployés sur :
- Netlify
- Vercel
- GitHub Pages
- Tout autre hébergeur de sites statiques


## 👨‍💻 Auteur

William Banas

---
