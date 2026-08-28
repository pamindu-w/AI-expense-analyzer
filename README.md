# SpendWise — AI Expense Analyzer

> A full-stack personal expense tracker with a React frontend and FastAPI (Prisma + PostgreSQL) backend.

---

## Tech Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Recharts               |
| Backend  | FastAPI, Prisma (Python client), Pydantic, Uvicorn |
| Database | PostgreSQL                                         |
| Auth     | JWT (python-jose) + hashed passwords (passlib)     |

---

## Project Structure

```text
AI-expense-analyzer/
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (Login, Signup, Dashboard…)
│   │   ├── services/        # API layer (fetch-based, single API_URL)
│   │   └── styles/          # Extra CSS
│   └── .env                 # VITE_API_URL (not committed)
│
└── backend/                 # FastAPI REST API
    ├── app/
    │   └── main.py          # App, CORS, routes, auth, Prisma client
    ├── prisma/
    │   ├── schema.prisma    # Data models (User, Expense, Budget, RecurringExpense)
    │   └── migrations/      # SQL migrations
    ├── main.py              # Uvicorn entry point (`from app.main import app`)
    └── .env                 # DATABASE_URL, SECRET_KEY (not committed)
```

---

## Backend Setup

```bash
cd backend
python3 -m venv .venv
.venv\Scripts\activate          # Windows
# Install dependencies
pip install uvicorn fastapi prisma python-dotenv passlib python-jose email-validator
# Generate Prisma client and sync the DB schema
prisma generate
prisma db push
# Run the server
python -m uvicorn main:app --reload
```

- API available at `http://127.0.0.1:8000`
- Interactive docs at `http://127.0.0.1:8000/docs`

See [`backend/README.md`](backend/README.md) for details and troubleshooting.

---

## Frontend Setup

```bash
cd frontend
npm install
# Configure environment (optional — defaults to http://127.0.0.1:8000)
echo "VITE_API_URL=http://127.0.0.1:8000" > .env
# Start dev server
npm run dev
```

All frontend API calls use the single `API_URL` exported from `src/services/api.ts`
(which reads `VITE_API_URL` with a `127.0.0.1:8000` fallback).

---

## API Endpoints

| Method | Endpoint                      | Description                 | Auth required |
| ------ | ----------------------------- | --------------------------- | ------------- |
| GET    | `/`                           | Health check                | No            |
| POST   | `/signup`                     | Create account              | No            |
| POST   | `/login`                      | Get JWT token               | No            |
| GET    | `/validate`                   | Validate JWT                | Yes           |
| GET    | `/expenses`                   | List expenses               | Yes           |
| POST   | `/expenses`                   | Create expense              | Yes           |
| PUT    | `/expenses/{id}`              | Update expense              | Yes           |
| DELETE | `/expenses/{id}`              | Delete expense              | Yes           |
| GET    | `/budgets`                    | List budgets                | Yes           |
| POST   | `/budgets`                    | Create budget               | Yes           |
| PUT    | `/budgets/{id}`               | Update budget limit         | Yes           |
| GET    | `/budgets/progress`           | Budget spending progress    | Yes           |
| GET    | `/recurring-expenses`         | List recurring expenses     | Yes           |
| POST   | `/recurring-expenses`         | Create recurring expense    | Yes           |
| PUT    | `/recurring-expenses/{id}`    | Update recurring expense    | Yes           |
| DELETE | `/recurring-expenses/{id}`    | Delete recurring expense    | Yes           |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable      | Description                                    |
| ------------- | ---------------------------------------------- |
| `DATABASE_URL`| PostgreSQL connection string                   |
| `SECRET_KEY`  | JWT signing secret (falls back to a dev value) |

### Frontend (`frontend/.env`)

| Variable         | Description                                  |
| ---------------- | -------------------------------------------- |
| `VITE_API_URL`   | Backend base URL (defaults to `http://127.0.0.1:8000`) |

---

## Development Notes

- Secrets (`.env`), virtual environments, and build artifacts are git-ignored — do not commit them.
- CORS is configured in `backend/app/main.py` for local dev origins.
