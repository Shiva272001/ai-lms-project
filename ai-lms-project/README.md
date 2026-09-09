# AI Learning Management System (AI LMS)

A complete full-stack **AI-Powered Learning Management System** built with **FastAPI (Python)** and **React (JavaScript)**.

---

## 🌟 Architecture & Tech Stack

- **Backend**: FastAPI, SQLAlchemy, LangChain, Google Gemini API, PostgreSQL (Neon / SQLite)
- **Frontend**: React.js, React Router, Axios, Recharts, jsPDF
- **Deployment**:
  - **Backend**: Deployed on [Render](https://render.com)
  - **Frontend**: Deployed on [Netlify](https://netlify.com)

---

## 📁 Repository Structure

```text
ai-lms-project/
├── backend/                  # FastAPI Application
│   ├── main.py               # Entry point
│   ├── database.py           # DB connection setup
│   ├── llm.py                # LLM integration & helpers
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment variable template
│   └── routers/              # AI feature API endpoints
└── frontend/                 # React Application
    ├── package.json          # Node dependencies
    ├── netlify.toml          # Netlify routing configuration
    ├── .env.example          # Frontend environment variable template
    └── src/
        ├── App.jsx           # Routing & App layout
        ├── api.js            # Axios client configuration
        └── components/       # UI components for AI modules
```

---

## 🚀 Deployment Guide

### 1️⃣ Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** > **Web Service**.
2. Connect your GitHub Repository.
3. Configure settings:
   - **Root Directory**: `ai-lms-project/backend` (or `backend` if deploying from backend repo root)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables** in Render settings:
   - `AI_PROVIDER`: `gemini`
   - `GOOGLE_API_KEY`: *Your Google Gemini API Key*
   - `DATABASE_URL`: *Your PostgreSQL Connection String*
5. Click **Create Web Service**. Copy the generated Render Service URL (e.g., `https://ai-lms-backend.onrender.com`).

---

### 2️⃣ Deploy Frontend on Netlify

1. Log into [Netlify Dashboard](https://app.netlify.com/) and click **Add new site** > **Import an existing project**.
2. Select **GitHub** and authorize access to your repository.
3. Configure Build Settings:
   - **Base directory**: `ai-lms-project/frontend` (or `frontend`)
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Click **Environment variables** > **Add a variable**:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://ai-lms-backend.onrender.com` *(Your Render backend URL)*
5. Click **Deploy site**.

---

## 💻 Local Development Setup

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Update with your API keys
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # Points REACT_APP_API_URL to http://localhost:8000
npm start
```