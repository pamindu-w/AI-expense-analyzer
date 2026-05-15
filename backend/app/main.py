from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base
from app.models import user, expense  # noqa: F401 — ensures tables are registered
from app.routes import auth_routes, expense_routes

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpendWise API",
    description="AI-powered personal expense tracker",
    version="1.0.0",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ROUTERS ─────────────────────────────────────────────────────────────────
app.include_router(auth_routes.router, tags=["Auth"])
app.include_router(expense_routes.router, prefix="/expenses", tags=["Expenses"])


# ─── ROOT ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "SpendWise API is running ✅", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}