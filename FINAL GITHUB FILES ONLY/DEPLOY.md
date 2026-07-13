# Deploy With GitHub Pages

## 1. Upload This Folder

Create a new GitHub repository, then upload the contents of this folder:

- `index.html`
- `firebase-config.js`
- `firebase-config.example.js`
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `README.md`
- `DEPLOY.md`
- `.gitignore`
- `.nojekyll`
- `.firebaserc.example`

Upload the files inside the folder, not the folder itself.

## 2. Turn On GitHub Pages

1. Open the GitHub repository.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Choose branch `main`.
6. Choose folder `/root`.
7. Click `Save`.

GitHub will give you a public link like:

`https://your-username.github.io/curated-wish-list/`

## 3. Embed In Notion

1. Copy the GitHub Pages link.
2. Open your Notion page.
3. Type `/embed`.
4. Paste the link.
5. Resize the embed frame until it feels right.

## Optional: Firebase Sync

The app works locally without Firebase. Add Firebase only if you want the same wish list data across multiple devices.

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click `Add project`.
3. Add a web app.
4. Copy the Firebase config object.
5. Paste the values into `firebase-config.js`.

The Firebase web app config is public client config. Do not put service account keys or admin SDK credentials in this project.

### Turn On Anonymous Auth

1. Open `Authentication`.
2. Click `Get started`.
3. Open `Sign-in method`.
4. Enable `Anonymous`.

### Create Firestore Database

1. Open `Firestore Database`.
2. Click `Create database`.
3. Start in production mode.

### Firestore Rules

The repository includes `firestore.rules`:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /shopping/curated-wish-list {
      allow read, write: if request.auth != null;
    }
  }
}
```

Deploy the rules with the Firebase CLI from this folder:

```bash
firebase deploy --only firestore:rules
```

### Firebase Hosting

This folder also includes `firebase.json`, so you can host with Firebase instead of GitHub Pages.

1. Copy `.firebaserc.example` to `.firebaserc`.
2. Replace `your-firebase-project-id` with your Firebase project ID.
3. Run:

```bash
firebase deploy --only hosting
```

Anyone with the link can open the app, so only share the GitHub Pages URL with people who should use it.
