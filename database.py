import databases
import sqlalchemy
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, Text, DateTime, String
from datetime import datetime
import os

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./transcripts.db")

# Create database instance
database = databases.Database(DATABASE_URL)

# Define the tables
metadata = MetaData()

transcripts = Table(
    "transcripts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("full_text", Text)
)

patients = Table(
    "patients",
    metadata,
    Column("id", String, primary_key=True),
    Column("mrn", String, unique=True, nullable=False),
    Column("first_name", String, nullable=False),
    Column("last_name", String, nullable=False),
    Column("date_of_birth", String, nullable=False),
    Column("last_updated", DateTime, default=datetime.utcnow),
    Column("medical_data", Text)  # JSON string for medical data
)

# Create engine for table creation
engine = create_engine(DATABASE_URL)

# Create tables
metadata.create_all(engine)
