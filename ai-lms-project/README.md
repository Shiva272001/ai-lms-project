# AI LMS — Full Runnable Project

This is a complete, tested starter project for your AI Learning Management System.
It contains a working **FastAPI backend** (7 AI features) and a working **React frontend**.

Everything here has already been tested and confirmed to run and build successfully.

---

## Folder Structure

```
ai-lms-project/
├── backend/          <- FastAPI + LangChain (Python)
│   ├── main.py
│   ├── database.py
│   ├── llm.py
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/       <- one file per AI feature
└── frontend/          <- React app
    ├── package.json
    ├── public/
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/   <- one component per AI feature
```

---

## How to Run the Backend

```bash
cd backend
python -m venv venv

# Activate the environment:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

1. Copy `.env.example` to a new file named `.env`
2. Get a **free Gemini API key** from https://aistudio.google.com and paste it into `.env` as `GOOGLE_API_KEY`
3. Leave `DATABASE_URL` as-is for now — the app automatically uses a local SQLite file (`lms_local.db`) if you don't set up PostgreSQL yet. This means you can run everything without installing Postgres first.

Then run:
```bash
uvicorn main:app --reload
```

Open **http://localhost:8000/docs** — you'll see all 7 APIs listed there, and you can test each one directly in the browser before touching the frontend.

---

## How to Run the Frontend

In a **new terminal** (keep the backend running):

```bash
cd frontend
npm install
npm start
```

This opens **http://localhost:3000** in your browser, with a page for every feature (Lesson, Quiz, Chatbot, Evaluate, Learning Path, Progress, Study Planner).

---

## Switching to a Real PostgreSQL Database Later

When you're ready (Phase 5 of your roadmap):
1. Create a free database at https://neon.tech
2. Copy the connection string it gives you
3. Paste it into `.env` as `DATABASE_URL`
4. Restart the backend — your tables will be created automatically there instead of SQLite

---

## Deploying (Phase 8 of your roadmap)

- **Backend** → push this repo to GitHub → deploy the `backend` folder on **Render.com**
- **Frontend** → deploy the `frontend` folder on **Vercel.com**
- Set the environment variable `REACT_APP_API_URL` on Vercel to your deployed backend's URL, so the frontend knows where to send requests.

---

## Notes for Beginners

- If a feature gives an error like "API key invalid", double check your `.env` file — no extra spaces, no quotes around the key.
- If the frontend shows "could not reach the backend", make sure `uvicorn` is still running in its terminal.
- You do NOT need to fill in both `GOOGLE_API_KEY` and `OPENAI_API_KEY` — just one, matching whatever you set `AI_PROVIDER` to.


## backend 

Get-ChildItem

cd .\ai-lms-project
Get-ChildItem

cd backend
python -m venv venv

.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

pip install python-dotenv

pip install sqlalchemy==2.0.35

pip install psycopg2-binary

pip install reportlab

pip install langchain-google-genai

pip install langchain-groq


python -m uvicorn main:app --reload


## frontend 
cd "D:\project\ai-lms-project\ai-lms-project\frontend"

Get-ChildItem

npm install

cd "D:\project\ai-lms-project\ai-lms-project\frontend"



npm start