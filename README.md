# Cravy (FastAPI + Next.js + Redux Toolkit)

## Backend (Python)
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # set DATABASE_URL, SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
python -m app.seed              # demo data (everything is flagged is_demo)
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                          # tests
```
Production migrations: `alembic revision --autogenerate -m init && alembic upgrade head`.

## Frontend (Next.js)
```
cd frontend
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```
Replace demo menu: edit `backend/app/seed.py` and re-run the seed (idempotent).

## Admin
Open `/admin` and sign in with ADMIN_EMAIL / ADMIN_PASSWORD (created by the seed). From **Settings** enter your real Easypaisa/bank details and enable the methods; from **Products** edit prices and availability.

## Deployment
Frontend on Vercel (set `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`). Backend on any Python host (Render, Railway, Fly) with managed Postgres: `pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `SECRET_KEY` and `CORS_ORIGINS` to your site URL.

## Testimonials
Genuine Google reviews live in `frontend/src/config/reviews.ts` (add or remove entries; keep the wording exact).

## Uploads and notifications
Product photos upload from Admin > Products and are served at `/media/products`. Payment receipts are private: only a logged-in admin can open them. On Render/Railway use a persistent disk (or move uploads to S3-compatible storage) so files survive redeploys. Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` and `ADMIN_NOTIFY_EMAIL` to enable order emails; a message is logged as SENT only if the SMTP server accepted it.

## Updating an existing database
This update adds columns (`tax_percent`, `tax_total`, `delivery_zone`) and a `delivery_zones` table. For local SQLite, delete `backend/cravy.db` and re-run `python -m app.seed`. For Postgres run `alembic revision --autogenerate -m zones_tax && alembic upgrade head`.

## Delivery and tax
Admin > Delivery: add areas with a charge, optional free-delivery threshold and optional minimum order. With at least one active area, customers pick one at checkout; with none, the flat charge in Settings is used. Admin > Settings > Tax adds a percentage on top of (subtotal - discount). Admin > Products > Sizes & toppings edits each product's options.
