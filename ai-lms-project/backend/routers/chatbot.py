from fastapi import APIRouter
from pydantic import BaseModel

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

from llm import get_llm


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/chatbot",
    tags=["Doubt Chatbot"]
)


# =========================================================
# LLM
# =========================================================

llm = get_llm(
    temperature=0.5
)


# =========================================================
# CHAT STORE
# =========================================================

chat_store = {}


def get_session_history(session_id: str):

    if session_id not in chat_store:

        chat_store[session_id] = (
            InMemoryChatMessageHistory()
        )

    return chat_store[session_id]


# =========================================================
# CHAT CHAIN
# =========================================================

chat_chain = RunnableWithMessageHistory(
    llm,
    get_session_history
)


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):

    student_question: str

    # Each student can have a separate conversation
    session_id: str = "student_1"


# =========================================================
# ASK DOUBT
# =========================================================

@router.post("/ask")
def ask_doubt(req: ChatRequest):

    # Check empty question
    if not req.student_question.strip():

        return {
            "answer": "Please enter your question.",
            "session_id": req.session_id
        }


    # Call chatbot
    response = chat_chain.invoke(

        req.student_question.strip(),

        config={
            "configurable": {
                "session_id": req.session_id
            }
        }
    )


    # Return answer
    return {
        "answer": response.content,
        "session_id": req.session_id
    }


# =========================================================
# CLEAR CHAT
# =========================================================

@router.delete("/clear/{session_id}")
def clear_chat(session_id: str):

    if session_id in chat_store:

        del chat_store[session_id]


    return {
        "message": "Chat history cleared successfully.",
        "session_id": session_id
    }