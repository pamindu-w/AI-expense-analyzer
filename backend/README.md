# Backend Run Guide

This backend is a FastAPI app with Prisma (Python client) and PostgreSQL.

When using Neon, the Neon CLI-generated project-root `.env.local` is loaded
automatically and takes precedence for `DATABASE_URL`.

## 1. Prerequisites

- Python 3.11+ (3.14 is also fine)
- A Neon PostgreSQL project, or another PostgreSQL database
- A valid `DATABASE_URL`

Example `.env` value:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/expense_analizer
```

## 2. Create and activate virtual environment

From the `backend` folder on Windows:

```bash
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

On macOS/Linux, use `python3 -m venv .venv` and `source .venv/bin/activate`.

## 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

## 4. Generate Prisma client and sync database

```bash
mkdir -p .binaries
prisma py fetch --force
prisma generate --schema prisma/schema.prisma

# Use DATABASE_URL_UNPOOLED for schema changes when using Neon.
$env:DATABASE_URL = $env:DATABASE_URL_UNPOOLED
prisma db push --schema prisma/schema.prisma
```

Notes:
- `prisma generate` fixes: `The Client hasn't been generated yet`.
- `prisma db push` creates/syncs the database schema (and can create the DB if missing).

## 5. Start backend server

Run from the `backend` folder:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:
- `http://127.0.0.1:8000`

For Neon, use the pooled `DATABASE_URL` for normal application traffic and
`DATABASE_URL_UNPOOLED` for Prisma schema changes. The Neon CLI-generated
project-root `.env.local` is loaded automatically by the backend.

Health check:

```bash
curl http://127.0.0.1:8000/
```

Expected:

```json
{"message":"Backend connected successfully"}
```

## 6. CORS for frontend

The backend currently allows frontend dev origins on port `5173`.
If you run frontend on another port, add that origin in `app/main.py`.

## Troubleshooting

- `No module named uvicorn`
  - Use the venv command: `./.venv/bin/python -m uvicorn ...`
- `Prisma BinaryNotFoundError`
  - Run `prisma py fetch` during the build before `prisma generate`. The
    project config stores the binaries in the deployable `backend/.binaries`
    directory instead of Render's non-persistent home cache.
- `Could not import module "main"`
  - Start Uvicorn from the `backend` directory.
- `The Client hasn't been generated yet`
  - Run `./.venv/bin/prisma generate`.
- `Database ... does not exist`
  - Run `./.venv/bin/prisma db push` and ensure PostgreSQL is running.
- `Address already in use`
  - Port 8000 is already occupied. Stop old process or use another port.
