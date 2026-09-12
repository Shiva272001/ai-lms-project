from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db

from routers import (
    lesson,
    quiz,
    chatbot,
    evaluate,
    learning_path,
    analytics,
    study_planner,
    converter,
)

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="AI LMS Backend",
    description="AI-powered Learning Management System API",
    version="1.0.0",
)


# =========================================================
# CORS FOR REACT FRONTEND
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE INITIALIZE
# =========================================================

try:
    init_db()
    print("Database connected successfully")

except Exception as e:
    print(f"Database initialization error: {e}")


# =========================================================
# IMAGE FOLDER SETUP
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

IMAGE_FOLDER = os.path.join(
    BASE_DIR,
    "images"
)

VIDEO_FOLDER = os.path.join(
    BASE_DIR,
    "videos"
)

AUDIO_FOLDER = os.path.join(
    BASE_DIR,
    "audios"
)

PPT_FOLDER = os.path.join(
    BASE_DIR,
    "ppts"
)

os.makedirs(
    VIDEO_FOLDER,
    exist_ok=True
)

os.makedirs(
    AUDIO_FOLDER,
    exist_ok=True
)

os.makedirs(
    PPT_FOLDER,
    exist_ok=True
)

app.mount(
    "/images",
    StaticFiles(
        directory=IMAGE_FOLDER
    ),
    name="images",
)

app.mount(
    "/videos",
    StaticFiles(
        directory=VIDEO_FOLDER
    ),
    name="videos",
)

app.mount(
    "/audios",
    StaticFiles(
        directory=AUDIO_FOLDER
    ),
    name="audios",
)

app.mount(
    "/ppts",
    StaticFiles(
        directory=PPT_FOLDER
    ),
    name="ppts",
)


# =========================================================
# INCLUDE ROUTERS
# =========================================================

app.include_router(
    lesson.router
)

app.include_router(
    quiz.router
)

app.include_router(
    chatbot.router
)

app.include_router(
    evaluate.router
)

app.include_router(
    learning_path.router
)

app.include_router(
    analytics.router
)

app.include_router(
    study_planner.router
)

app.include_router(
    converter.router
)


# =========================================================
# HOME API
# =========================================================

@app.get("/")
def home():

    return {
        "message": "AI LMS backend is running",

        "docs": "http://127.0.0.1:8000/docs",

        "images": "http://127.0.0.1:8000/images/test.png",
    }