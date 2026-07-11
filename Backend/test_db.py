from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:8248@localhost:5432/tts_database"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT current_database();"))
        print("Connected to:", result.scalar())

        result = conn.execute(text("SELECT COUNT(*) FROM users;"))
        print("Users:", result.scalar())

    print("✅ Database connection successful!")

except Exception as e:
    print("❌ Database connection failed:")
    print(e)