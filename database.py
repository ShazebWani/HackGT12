import databases
import sqlalchemy
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, Text, DateTime
from datetime import datetime
import os

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./transcripts.db")

# Create database instance
database = databases.Database(DATABASE_URL)

# Define the transcripts table
metadata = MetaData()

transcripts = Table(
    "transcripts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("full_text", Text)
)

# Create engine for table creation
engine = create_engine(DATABASE_URL)

# Create tables
metadata.create_all(engine)
