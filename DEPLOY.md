# Deploy Synk on Vercel + Firebase

Synk uses **Firebase Firestore** as the database. Deploy the Next.js app on **Vercel** and connect it to your Firebase project.

## 1. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (e.g. `synk-app`).
2. In the project, open **Build → Firestore Database** → **Create database** → start in **production mode** (we use server-side rules via Admin SDK).
3. Open **Project settings** (gear icon) → **Service accounts** → **Generate new private key**.
4. Save the JSON file — you will add it to Vercel as an environment variable.

## 2. Push code to GitHub

```bash
git add .
git commit -m "Switch to Firebase Firestore for Vercel deployment"
git push origin main
```

## 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import `mihirk25/synk`.
2. Under **Environment Variables**, add:

   | Name | Value |
   |------|--------|
   | `FIREBASE_SERVICE_ACCOUNT_KEY` | Paste the **entire** service account JSON as one line |

   Alternatively, use three variables instead:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (keep `\n` for newlines in the key)

3. Click **Deploy**.

## 4. Seed demo data (one time)

On your computer, with Firebase credentials in `.env`:

```bash
npm install
npm run db:seed
```

This creates demo users, staff, and sample data in Firestore.

## 5. Log in

Open your Vercel URL:

- **Manager:** `manager@synk.app` / `synk1234`
- **Staff:** `staff@synk.app` / `synk1234`

Change these passwords before sharing the live app.

## Local development

1. Copy `.env.example` to `.env`.
2. Add your `FIREBASE_SERVICE_ACCOUNT_KEY` (or the three separate Firebase vars).
3. Run:

```bash
npm install
npm run db:seed
npm run dev
```

## Firestore indexes

If Firebase asks you to create indexes (e.g. for `users` by `email`), click the link in the error message in Vercel logs, or add them in the Firebase console under **Firestore → Indexes**.

## Notes

- The app uses the **Firebase Admin SDK** on the server only — no client Firebase config is needed.
- Sessions and all shop data live in Firestore collections under your Firebase project.
