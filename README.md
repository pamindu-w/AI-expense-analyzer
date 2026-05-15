# SpendWise — AI Expense Analyzer

> A full-stack personal expense tracker with a React frontend and FastAPI backend.

---

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Recharts        |
| Backend  | FastAPI, SQLAlchemy, Pydantic v2, Uvicorn   |
| Database | SQLite (dev) / PostgreSQL (production)      |
| Auth     | JWT (python-jose) + bcrypt (passlib)        |

---

## Project Structure

```text
AI-expense-analyzer/
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components (Login, Signup, Dashboard…)
│   │   ├── services/     # API layer (fetch-based)
│   │   └── styles/       # Extra CSS
│   └── .env              # VITE_API_URL (not committed)
│
└── backend/           # FastAPI REST API
    ├── app/
    │   ├── main.py       # App factory, CORS, router registration
    │   ├── database.py   # SQLAlchemy engine & session
    │   ├── models/       # ORM models (User, Expense)
    │   ├── schemas/      # Pydantic schemas
    │   ├── routes/       # Auth & Expense routers
    │   └── utils/        # security helpers (JWT, bcrypt)
    ├── main.py           # Uvicorn entry point

1 — Backend
bash
cd backend
# Create & activate virtual environment (Python 3.11 recommended)
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY
# Run the server
uvicorn main:app --reload
API is available at http://127.0.0.1:8000
Interactive docs at http://127.0.0.1:8000/docs

2 — Frontend
bash
cd frontend
# Install dependencies
npm install
# Configure environment (optional — defaults to localhost:8000)
echo "VITE_API_URL=http://127.0.0.1:8000" > .env
# Start dev server
npm run dev

API Endpoints
Method	Endpoint	Description	Auth required
GET	/	Health check	No
POST	/signup	Create account	No
POST	/login	Get JWT token	No
GET	/validate	Validate JWT	Yes
GET	/expenses/	List all expenses	No
POST	/expenses/	Create expense	No
PUT	/expenses/{id}	Update expense	No
DELETE	/expenses/{id}	Delete expense	No
Environment Variables
Backend (backend/.env)
Variable	Default	Description
DATABASE_URL	sqlite:///./spendwise.db	DB connection string
SECRET_KEY	(must be set)	JWT signing secret
Frontend (frontend/.env)
Variable	Default	Description
VITE_API_URL	http://127.0.0.1:8000	Backend base URL
Development Notes
Database migrations: Tables are auto-created via Base.metadata.create_all() on startup. For production, use Alembic.
PostgreSQL: Set DATABASE_URL=postgresql://user:pass@host:5432/dbname in backend/.env.
CORS: The backend allows localhost:5173 (Vite) and localhost:3000. Update app/main.py for other origins.
    ├── requirements.txt
    └── .env              # DATABASE_URL, SECRET_KEY (not committed)
