# Deploy Synk

Synk uses **SQLite** locally. For production, deploy with a **persistent disk** (Railway recommended).

## 1. Push code to GitHub

```bash
git add .
git commit -m "Prepare Synk for deployment"
git push origin main
```

## 2. Deploy on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select `mihirk25/synk`.
3. Railway will detect the `Dockerfile` and build automatically.
4. Open your service → **Settings** → **Networking** → **Generate domain** (e.g. `synk-production.up.railway.app`).
5. Add a **Volume**:
   - Mount path: `/data`
   - This keeps your database across deploys.
6. Set environment variables (optional — defaults work for first deploy):

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | `file:/data/prod.db` |
   | `NODE_ENV` | `production` |

7. After the first successful deploy, seed demo data (one time):

   ```bash
   railway run npx prisma db seed
   ```

   Or use Railway’s **Shell** in the dashboard and run the same command.

## 3. Log in

Open your Railway URL and sign in with:

- **Manager:** `manager@synk.app` / `synk1234`
- **Staff:** `staff@synk.app` / `synk1234`

Change these passwords before sharing the app with your team.

## Why not Vercel?

Vercel is serverless and does not keep a SQLite file between requests. To use Vercel you would need to switch the database to **PostgreSQL** (e.g. Neon). Railway + volume is the fastest path with your current setup.
