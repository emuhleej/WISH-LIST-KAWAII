# Deploy With GitHub Pages

## 1. Upload This Folder's Contents

Create a new GitHub repository (it must be **Public** — GitHub Pages doesn't work on private repos with a free account), then upload the contents of this folder:

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

Upload the files inside the folder, **not the folder itself**. After uploading, `index.html` must be visible at the top level of the repo — not inside a subfolder.

Tip: on some computers, files starting with a dot (`.gitignore`, `.nojekyll`) are hidden. If you drag-and-drop and they don't come along, that's fine — the app still works without them. `index.html` is the only file GitHub Pages truly needs.

## 2. Turn On GitHub Pages

1. Open the GitHub repository.
2. Go to `Settings`.
3. Open `Pages` (left sidebar).
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Branch: `main`. Folder: `/ (root)`.
6. Click `Save`.

Your link will look like:

`https://your-username.github.io/your-repo-name/`

## If You Get a 404

Work down this list — one of these is almost always the cause:

1. **Wait 2–5 minutes.** The very first Pages build takes a few minutes. Refresh after waiting. Check the `Actions` tab of the repo — a green checkmark on "pages build and deployment" means it's live.
2. **Check the URL matches the repo name exactly.** The URL is `https://USERNAME.github.io/REPO-NAME/` — same capitalization, same spelling, with the trailing part matching the repository name.
3. **Confirm `index.html` is at the root of the repo.** If you see a folder in the repo and `index.html` is inside it, the page will 404. Move the files up to the top level (or add the folder name to the URL).
4. **Confirm the repo is Public.** Settings → General → Danger Zone → Change visibility.
5. **Confirm Pages is actually enabled.** Settings → Pages should show "Your site is live at..." once it's built.

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

Deploy the included `firestore.rules` with the Firebase CLI from this folder:

```bash
firebase deploy --only firestore:rules
```

### Firebase Hosting (alternative to GitHub Pages)

1. Copy `.firebaserc.example` to `.firebaserc`.
2. Replace `your-firebase-project-id` with your Firebase project ID.
3. Run:

```bash
firebase deploy --only hosting
```

Anyone with the link can open the app, so only share the URL with people who should use it.
