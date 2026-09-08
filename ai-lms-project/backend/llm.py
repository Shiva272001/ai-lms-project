import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

load_dotenv()


def get_llm(temperature=0.4, provider=None):
    if not provider:
        provider = os.getenv("AI_PROVIDER", "gemini").lower()

    if provider == "groq":
        return ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=temperature,
        )

    elif provider == "openai":
        return ChatOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            model="gpt-4o-mini",
            temperature=temperature,
        )

    elif provider in ["gemini", "google"]:
        return ChatGoogleGenerativeAI(
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            model="gemini-3.5-flash-lite",
            temperature=temperature,
        )

    raise Exception(f"Unsupported AI_PROVIDER: {provider}")


# Usage example:
llm = get_llm(provider="gemini")
