# BAJARANG – દુકાનની ભાવ યાદી

BAJARANG is a small, mobile-first web app for our family vegetable and grocery shop.
It keeps **one shared, up-to-date price list**, so the same item sells at the same price
whoever is at the counter.

It is deliberately simple: it is not a billing, accounting, inventory or SaaS product.

---

## Features

- **Gujarati interface** throughout (Noto Sans Gujarati font).
- **Price list**: selling prices for 100 g, 250 g, 500 g, 1 kg and per piece (1 નંગ), plus the purchase price per kg. Every price is optional (at least one is needed), and each product card shows only the prices it uses, e.g. potato: 1 kg; rice: 100 g; lemon: per piece.
- **Show / hide prices**: on the product form, "ભાવ યાદીમાં બતાવો" turns each entered price on or off. A hidden price stays saved but is not shown in the price list (e.g. keep 250 g saved but show only the piece price). At least one price must stay visible.
- **Auto-fill with manual override**: type one weight price and the heavier ones fill in proportionally (250 g ₹20 → 500 g ₹40, 1 kg ₹80). Change any of them by hand for discounts (₹20 / ₹35 / ₹60). Typed or already-saved prices are never overwritten.
- **Instant search** in Gujarati or English while you type, with a clear button. Matching ignores spaces, so "લાલમરચું" finds "લાલ મરચું".
- **Filters**: by category, in stock / out of stock, and sort by name or by last updated.
- **Stock toggle** directly in the list, with an undo option. Out-of-stock items keep their prices.
- **Price history**: every real price change is recorded with the time and an optional name (નારણભાઈ / વલ્લભભાઈ / જયદીપ).
- **Typo guards on the form**: warns if a smaller weight costs more than a bigger one, if the selling price is below the purchase price, or if an item with the same name already exists.
- **Categories**: add, rename, switch on/off. A category that still has items cannot be deleted.
- **ખરીદી (daily purchase list)**: a shared list with one tab per place to buy (માર્કેટ, બારડી, હરભોલે, અન્ય; rename or add places). Items to buy show ✗ (not needed); not-needed items show ✓ (buy again). Edit happens inline in the row: ✓ saves the name and moves the item to "to buy", 🗑 deletes it. The share button sends the place's to-buy list as plain text (WhatsApp, notes, SMS).
- **Sync across phones**: data reloads when the app opens, when you return to it, and every 45 seconds.
- **Shared PIN** access. The PIN is checked on the server and never stored in the frontend code.
- **Remembers the operator**: the name picked in the product form is pre-selected next time on that phone.
- **Mobile-only layout**: one design for phones, max 640px wide; on a computer it is centred in the same column.
- **Installable app (PWA)**: "Add to Home screen" on Android gives it its own icon and full screen.

## Technology

| Part     | Stack                                                 |
| -------- | ----------------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Lucide icons |
| Backend  | Node.js (20+), Express 5                              |
| Database | MongoDB (Atlas in production) with Mongoose           |

## Project structure

```
Bajarang/
├── brand/                     original logo files (wordmark + square icon)
├── client/                    React app (deploy as a static site)
│   ├── public/                manifest, service worker, app icons, SPA redirects
│   └── src/
│       ├── assets/            logo images used inside the app
│       ├── components/        ProductRow, ProductList, PriceHistoryModal, SearchBar…
│       │   └── ui/            Button, Field, Toggle, Modal, States (design system)
│       ├── context/           Auth, Settings (remembered operator), Toast, ShopData (shared product list)
│       ├── hooks/             useAvailabilityToggle
│       ├── layouts/           AppLayout (single mobile layout, max 640px, bottom nav)
│       ├── pages/             Dashboard, Products, ProductForm, Purchase (ખરીદી), Categories, Login
│       ├── services/api.js    all API calls
│       └── utils/             formatting, search/filter, constants
├── server/                    Express API (deploy as a Vercel project)
│   ├── api/index.js           Vercel serverless entry (wraps the Express app)
│   ├── vercel.json            routes all requests to the API, Mumbai region
│   ├── src/
│   │   ├── config/            env loading + MongoDB connection
│   │   ├── models/            Product, Category, PriceHistory, PurchaseSource, PurchaseItem
│   │   ├── controllers/       product, category, auth
│   │   ├── routes/            /api routes
│   │   ├── middleware/        PIN token check, login rate limit, error handler
│   │   ├── utils/             validation, token signing, errors
│   │   └── seed/              sample data + seed script
│   └── test/api.test.js       API integration tests
└── package.json               convenience scripts for both parts
```

---

## Run it locally

### 1. Requirements

- Node.js 20 or newer
- MongoDB: either a local install (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas cluster (see below)

### 2. Install

```bash
npm run install:all
```

### 3. Configure the backend

```bash
cd server
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
```

Edit `server/.env`:

| Variable         | Meaning |
| ---------------- | ------- |
| `MONGODB_URI`    | MongoDB connection string |
| `APP_PIN`        | Shared family PIN, 4–8 digits |
| `AUTH_SECRET`    | Long random string (≥ 32 characters) used to sign login tokens |
| `TOKEN_TTL_DAYS` | How long a phone stays logged in (default 60) |
| `CLIENT_ORIGIN`  | Frontend URL(s) allowed to call the API, comma separated |
| `PORT`           | API port (default 5000) |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The frontend needs no configuration for local development: Vite forwards `/api` to `http://localhost:5000`.
`client/.env.example` shows the one variable used in production.

### 4. Add sample data (optional)

```bash
npm run seed
```

This adds 8 categories and 25 sample products, marked **"નમૂનો"** in the app.
It is safe to run more than once: existing records are never duplicated or overwritten.
To remove the sample products later (your own items and the categories stay):

```bash
npm run seed:remove-samples --prefix server
```

### 5. Start

In two terminals:

```bash
npm run dev:server     # API on http://localhost:5000
npm run dev:client     # App on http://localhost:5173
```

Open http://localhost:5173 and enter the PIN from `server/.env`.

To try it on your phone, connect it to the same Wi-Fi and open `http://<your-computer-IP>:5173`.
Add that address to `CLIENT_ORIGIN` only if you call the API directly; the dev proxy already handles it.

### 6. Tests

```bash
npm test
```

These are API integration tests: PIN protection, validation, search and filters, price history, availability, category rules and deletion.
They use a separate `bajarang_test` database on local MongoDB, which is wiped before and after each run.
To point them at another database, set `TEST_MONGODB_URI`.

---

## MongoDB Atlas setup (free tier)

1. Create an account at https://www.mongodb.com/cloud/atlas and create a **free M0 cluster**. Pick the Mumbai region (closest).
2. **Database Access** → *Add New Database User*: choose a username and a strong password, role *Read and write to any database*.
3. **Network Access** → *Add IP Address*:
   - for local testing, *Add Current IP Address*;
   - for the hosted backend (Vercel), add `0.0.0.0/0`, because Vercel has no fixed IP addresses. The database user password still protects the data.
4. **Connect** → *Drivers* → copy the connection string and add the database name `bajarang`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bajarang?retryWrites=true&w=majority
   ```
   If the password contains special characters such as `@`, `#` or `/`, URL-encode them.
5. Put it in `MONGODB_URI`, then run `npm run seed` once if you want the sample data.

---

## Deployment

Everything runs on free plans: **Vercel** hosts both the API and the app (two Vercel projects from the same GitHub repository), and **MongoDB Atlas** stores the data.

- The API runs as a Vercel serverless function: `server/api/index.js` wraps the same Express app used locally, and `server/vercel.json` sends every request to it and runs it in the **Mumbai (`bom1`)** region, next to an Atlas cluster in Mumbai.
- The database connection is reused between requests (`server/src/config/db.js`).
- Note: the wrong-PIN limit (10 tries / 15 min) is kept in memory, so on serverless it is per instance and therefore less strict.

### 1. Backend → Vercel project (`server`)

1. Push this project to a private GitHub repository. `.env` files are gitignored, so check they are not committed.
2. On https://vercel.com: **Add New → Project** → import the repository.
3. **Root Directory**: `server`. Framework Preset: **Other**. Leave the build settings empty.
4. **Environment Variables**: `MONGODB_URI`, `APP_PIN`, `AUTH_SECRET`, `TOKEN_TTL_DAYS` (optional), and `CLIENT_ORIGIN` (fill in after step 2 below, e.g. `https://bajarang.vercel.app`).
5. Deploy, then open `https://<backend-project>.vercel.app/api/health`. It should return `{"success":true,"data":{"status":"ok"}}`.

### 2. Frontend → Vercel project (`client`)

1. **Add New → Project** → import the **same** repository again.
2. **Root Directory**: `client`. Framework Preset: **Vite** (detected). Build `npm run build`, output `dist` (defaults).
3. Environment variable: `VITE_API_URL=https://<backend-project>.vercel.app` (no trailing slash, no `/api`).
4. Deploy. SPA routing is already configured in `client/vercel.json`.

Other hosts also work: the backend runs anywhere Node runs (`npm start`), and the frontend is a static `dist` folder (`client/public/_redirects` covers Netlify).

### Connect the two

- Set `CLIENT_ORIGIN` on the backend project to the exact frontend URL (several URLs can be comma separated), then **Redeploy** the backend (Vercel applies environment variables only to new deployments).
- `VITE_API_URL` is baked in at build time, so if it changes, redeploy the frontend.
- Every `git push` to `main` redeploys both projects automatically.

### Install on the phones

Open the frontend URL in Chrome on each Android phone → menu (⋮) → **Add to Home screen / Install app**. Enter the PIN once; each phone stays logged in for `TOKEN_TTL_DAYS`.

---

## How access is protected

- Every `/api` route except `/api/health` and `/api/auth/login` needs a valid token. This includes reading, because purchase prices are private.
- The PIN is compared on the server in constant time. A correct PIN returns an HMAC-signed token with an expiry.
- Wrong PINs are rate-limited: 10 attempts per 15 minutes per IP.
- **Changing `APP_PIN` logs out every phone**, because tokens are signed with a key derived from the PIN. Use this if a phone is lost.
- CORS only allows the configured frontend origin(s). JSON bodies are capped at 50 kB, and inputs are validated and trimmed.
- The operator name (નારણભાઈ / વલ્લભભાઈ / જયદીપ) is only a label for history. It is not a verified identity.

Use a PIN that isn't easy to guess (not `1234`), and keep `AUTH_SECRET` secret.

---

## Backup

Data lives in MongoDB, so a phone breaking does not lose anything. For extra safety:

1. **Full database dump** (about once a month) with the [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools):
   ```bash
   mongodump --uri="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bajarang" --out=backups/2026-11-21
   # restore:
   mongorestore --uri="<same uri>" backups/2026-11-21
   ```
   This includes products, categories and price history. Keep the folder on Google Drive.
2. **Atlas**: paid clusters have automatic cloud backups. On the free tier, use option 1.

---

## API reference

All responses use the shape `{ "success": true, "data": … }` or
`{ "success": false, "error": { "message", "code", "fields?" } }`. Error messages are in Gujarati.
Send `Authorization: Bearer <token>` on protected routes.

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/login` | `{ pin }` → `{ token, expiresAt }` |
| GET | `/api/auth/check` | checks the token |
| GET | `/api/bootstrap` | `{ products, categories }` in one request (what the app loads on open; categories include `productCount`) |
| GET | `/api/products` | query: `search`, `category` (id or `none`), `availability` (`available` / `unavailable`), `sort` (`name`, `-name`, `updated`), optional `page` + `limit` (1-100) → adds `meta: { page, limit, total, hasMore }` |
| GET | `/api/products/:id` | |
| POST | `/api/products` | body: product fields + optional `updatedBy` |
| PUT | `/api/products/:id` | full update; records PriceHistory only if a price changed |
| DELETE | `/api/products/:id` | also deletes its history |
| PATCH | `/api/products/:id/availability` | `{ isAvailable, updatedBy? }` |
| GET | `/api/products/:id/history` | newest first |
| GET | `/api/categories` | includes `productCount` |
| POST | `/api/categories` | `{ nameGujarati, nameEnglish? }` |
| PUT | `/api/categories/:id` | rename |
| PATCH | `/api/categories/:id/status` | `{ isActive }` |
| DELETE | `/api/categories/:id` | only when it has no products (409 otherwise) |
| GET | `/api/purchase` | `{ sources, items }`; creates માર્કેટ / બારડી / હરભોલે / અન્ય the first time |
| POST | `/api/purchase/sources` | `{ name }` add a place to buy from |
| PUT | `/api/purchase/sources/:id` | `{ name }` rename |
| POST | `/api/purchase/items` | `{ name, sourceId, updatedBy? }` (starts as ✓) |
| PUT | `/api/purchase/items/:id` | `{ name, sourceId?, needed?, updatedBy? }` edit name (place optional) |
| PATCH | `/api/purchase/items/:id/needed` | `{ needed, updatedBy? }` ✓ = true, ✗ = false |
| DELETE | `/api/purchase/items/:id` | delete an item |

Price fields: `purchasePricePerKg`, `sellingPrice100g`, `sellingPrice250g`, `sellingPrice500g`, `sellingPrice1kg`, `sellingPricePerPiece`. Prices are numbers in INR, or `null` when not used; at least one selling price is required. `hiddenPrices` lists selling-price fields that are saved but not shown in the price list (at least one must stay visible).

## Customising

- **Operator names**: `client/src/utils/constants.js` (`OPERATORS`).
- **Colours / design tokens**: `client/src/index.css`.
- **Logo / app icon**: originals are in `brand/`. The app uses `client/src/assets/logo-wordmark.png` and `logo-mark.png`; the installed-app icons are in `client/public/icons/` (192, 512, maskable 512, apple-touch 180, favicon).
- **Sync interval**: `REFRESH_INTERVAL_MS` in `client/src/context/ShopDataContext.jsx`.

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| API exits with "Missing required environment variable" | Create `server/.env` from `.env.example`. |
| "સર્વર સાથે જોડાણ થયું નહીં" in the app | Backend not running or asleep, or `VITE_API_URL` is wrong. |
| Browser console shows a CORS error | `CLIENT_ORIGIN` doesn't exactly match the frontend URL (check https, no trailing slash). |
| Atlas connection timeout | Add your IP (or `0.0.0.0/0` for hosted backends) under Network Access. |
| Everyone was suddenly logged out | `APP_PIN` or `AUTH_SECRET` changed. This is expected. |
