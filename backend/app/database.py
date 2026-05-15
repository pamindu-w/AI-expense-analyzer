from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}


def create_engine_safe(database_url: str):
    engine = create_engine(database_url, connect_args=connect_args)
    try:
        with engine.connect() as conn:
            pass
        return engine
    except OperationalError as exc:
        if database_url.startswith("postgresql"):
            url = make_url(database_url)
            database_name = url.database
            if database_name:
                admin_url = url.set(database="postgres")
                admin_engine = create_engine(admin_url)
                try:
                    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                        conn.execute(text(f'CREATE DATABASE "{database_name}"'))
                    return create_engine(database_url, connect_args=connect_args)
                except OperationalError:
                    pass
        raise


engine = create_engine_safe(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
