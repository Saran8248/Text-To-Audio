import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hr_contact_agent.database")

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hr_contacts")
SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./hr_contacts.db")

engine = None
is_sqlite = False

# Attempt to configure PostgreSQL or fallback
def initialize_engine():
    global engine, is_sqlite
    
    # Check if DATABASE_URL is SQLite explicitly
    if DATABASE_URL.startswith("sqlite"):
        logger.info(f"Using SQLite database: {DATABASE_URL}")
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
        is_sqlite = True
        return

    # Attempt PostgreSQL
    try:
        logger.info(f"Connecting to database: {DATABASE_URL}")
        test_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Verify connection with a short timeout
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database.")
        engine = test_engine
        is_sqlite = False
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL at {DATABASE_URL}: {e}")
        if SQLITE_FALLBACK:
            sqlite_url = f"sqlite:///{SQLITE_DB_PATH}"
            logger.info(f"SQLITE_FALLBACK is enabled. Falling back to SQLite: {sqlite_url}")
            engine = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False}
            )
            is_sqlite = True
        else:
            # Re-raise or initialize standard engine so app can retry
            logger.error("PostgreSQL connection failed and fallback disabled. Using configured DATABASE_URL.")
            engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            is_sqlite = False

initialize_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables in database."""
    from app.models import Base
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
        raise e
