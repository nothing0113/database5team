from fastapi import FastAPI
from .database import engine, Base
from . import models

# Create tables on startup (for development/prototyping)
# In production, use Alembic for migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FloMe Backend")

@app.get("/")
def read_root():
    return {"message": "Welcome to FloMe API"}
