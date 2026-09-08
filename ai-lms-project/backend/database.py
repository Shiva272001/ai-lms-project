"""
Database configuration for AI LMS.
"""

import os
from datetime import datetime

from dotenv import load_dotenv

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
)

from sqlalchemy.orm import declarative_base, sessionmaker


# Load .env file
load_dotenv()


# Database URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./lms_local.db"
)


# -------------------------------
# DATABASE ENGINE
# -------------------------------

if DATABASE_URL.startswith("sqlite"):

    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False
        }
    )

else:

    # PostgreSQL / Neon configuration
    engine = create_engine(
        DATABASE_URL,

        # Avoid closed SSL connection problem
        pool_pre_ping=True,

        # Refresh old connections
        pool_recycle=300,

        # Keep connection pool stable
        pool_size=5,
        max_overflow=10,

        echo=False
    )



# -------------------------------
# SESSION
# -------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()



# ---------------- USERS TABLE
# -------------------------------

class User(Base):

    __tablename__ = "users"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    name = Column(
        String(100),
        nullable=False
    )


    email = Column(
        String(100),
        unique=True,
        nullable=False
    )


    role = Column(
        String(20),
        default="student"
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )



# ---------------- QUIZ RESULTS
# -------------------------------

class QuizResult(Base):

    __tablename__ = "quiz_results"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    student_id = Column(
        Integer,
        nullable=False
    )

    student_name = Column(
        String(150),
        nullable=True,
        default="Student"
    )

    roll_no = Column(
        String(50),
        nullable=True,
        default="1"
    )

    topic = Column(
        String(200),
        nullable=False
    )


    score = Column(
        Float
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )



# ---------------- LESSONS
# -------------------------------

class Lesson(Base):

    __tablename__ = "lessons"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    topic = Column(
        String(200),
        nullable=False
    )


    class_name = Column(
        Integer,
        nullable=False
    )


    title = Column(
        String(300)
    )


    content = Column(
        Text,
        nullable=False
    )


    summary = Column(
        Text
    )


    image_url = Column(
        String(500),
        nullable=True
    )


    pdf_file = Column(
        String(500),
        nullable=True
    )


    docx_file = Column(
        String(500),
        nullable=True
    )


    language = Column(
        String(30),
        default="English"
    )


    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )



# -------------------------------
# CREATE TABLES
# -------------------------------

def init_db():

    try:

        Base.metadata.create_all(
            bind=engine
        )

        print("Database connected successfully")

    except Exception as e:

        print("Database error:")
        print(e)



# -------------------------------
# DATABASE DEPENDENCY
# -------------------------------

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()