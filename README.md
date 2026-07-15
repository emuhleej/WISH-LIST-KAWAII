# Curated Wish List

An interactive, Notion-friendly wish list for saving products with links, pictures, prices, priorities, categories, notes, and shopping search shortcuts.

## Files

- `index.html` - the complete wish list app.
- `firebase-config.js` - optional Firebase config for cross-device sync.
- `firebase-config.example.js` - copy-safe config template.
- `firebase.json` - Firebase Hosting and Firestore setup.
- `firestore.rules` - Firestore access rules for anonymous signed-in users.
- `firestore.indexes.json` - empty index file required by Firebase deploys.
- `DEPLOY.md` - setup steps for GitHub Pages, Notion, and optional Firebase.
- `.gitignore` - keeps local/editor/Firebase cache files out of Git.
- `.nojekyll` - keeps GitHub Pages from changing how the site is served.

## Features

- Search product ideas across Google Shopping, Amazon, Target, Etsy, Walmart, and Pinterest.
- Save items with a product link, image link, price, store, category, priority, recipient, and notes.
- Filter by status, category, priority, recipient, and text search.
- Track total estimated cost and saved/purchased counts.
- Copy a Notion-friendly markdown list.
- Import/export JSON backups.
- Works locally right away, with optional Firebase sync.

## Git-Friendly Notes

Commit the whole folder as a static site. `firebase-config.js` can stay in Git with placeholder values; Firebase web app config is public client config, not an admin secret. Never commit Firebase service account keys or private admin credentials.

Suggested first commit:

```bash
git init
git add .
git commit -m "Add kawaii wish list app"
```

## Firebase-Friendly Notes

The app works without Firebase. To turn on sync, add your Firebase web app config to `firebase-config.js`, enable Anonymous Auth, create Firestore, then deploy the included `firestore.rules`.

The shared document path is:

```txt
shopping/curated-wish-list
```

## Notion Use

After GitHub Pages publishes the site, paste the public URL into Notion and choose `Embed`.
