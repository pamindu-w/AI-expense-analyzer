# Backend Run Guide

This backend is a FastAPI app with Prisma (Python client) and PostgreSQL.

## 1. Prerequisites

- Python 3.11+ (3.14 is also fine)
- PostgreSQL running locally on `localhost:5432`
- A valid `DATABASE_URL` in `.env`

Example `.env` value:

```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/expense_analizer
```

## 2. Create and activate virtual environment

From the `backend` folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

## 3. Install Python dependencies

```bash
pip install uvicorn fastapi prisma python-dotenv passlib python-jose email-validator
```

## 4. Generate Prisma client and sync database

```bash
./.venv/bin/prisma generate
./.venv/bin/prisma db push
```

Notes:
- `prisma generate` fixes: `The Client hasn't been generated yet`.
- `prisma db push` creates/syncs the database schema (and can create the DB if missing).

## 5. Start backend server

Run from the `backend` folder:

```bash
./.venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:
- `http://127.0.0.1:8000`

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
- `Could not import module "main"`
  - Start Uvicorn from the `backend` directory.
- `The Client hasn't been generated yet`
  - Run `./.venv/bin/prisma generate`.
- `Database ... does not exist`
  - Run `./.venv/bin/prisma db push` and ensure PostgreSQL is running.
- `Address already in use`
  - Port 8000 is already occupied. Stop old process or use another port.
