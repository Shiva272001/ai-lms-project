from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

from llm import get_llm


router = APIRouter(
    prefix="/study-planner",
    tags=["AI Study Planner"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class PlannerRequest(BaseModel):

    subjects: List[str] = Field(
        ...,
        min_length=1
    )

    hours_per_day: int = Field(
        ...,
        ge=1,
        le=24
    )

    days_left: int = Field(
        ...,
        ge=1,
        le=365
    )


# =========================================================
# GENERATE STUDY PLAN
# =========================================================

@router.post("/generate")
def study_planner(req: PlannerRequest):

    # -----------------------------------------------------
    # Clean subjects
    # -----------------------------------------------------

    subjects = [
        subject.strip()
        for subject in req.subjects
        if subject.strip()
    ]

    if not subjects:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one subject."
        )

    # -----------------------------------------------------
    # Create LLM
    # -----------------------------------------------------

    llm = get_llm(
        temperature=0.3
    )

    # -----------------------------------------------------
    # Prompt
    # -----------------------------------------------------

    prompt = f"""
You are an AI study planner.

Create a simple and practical day-wise study plan.

Subjects:
{subjects}

Hours available per day:
{req.hours_per_day}

Days left:
{req.days_left}

IMPORTANT RULES:

- Create exactly {req.days_left} days.
- Use only the subjects provided.
- Do not add extra subjects.
- Distribute study time realistically.
- Give more time to difficult subjects when possible.
- Keep the plan suitable for a student.
- Keep the plan simple and easy to follow.
- Include revision and practice where appropriate.
- Do not create impossible study schedules.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT use ```json.
- Do NOT add explanations outside the JSON.

Return exactly this structure:

{{
    "duration": "{req.days_left} days",
    "hours_per_day": {req.hours_per_day},
    "plan": [
        {{
            "day": 1,
            "subjects": [
                {{
                    "subject": "Subject Name",
                    "hours": 1,
                    "activity": "Study the topic and practice questions"
                }}
            ]
        }}
    ]
}}

Make sure the "plan" contains exactly {req.days_left} days.
"""

    # -----------------------------------------------------
    # Call LLM
    # -----------------------------------------------------

    try:

        result = llm.invoke(prompt)

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI study planner error: {str(e)}"
        )

    # -----------------------------------------------------
    # Get response
    # -----------------------------------------------------

    content = result.content

    # Handle LangChain content blocks
    if isinstance(content, list):

        text_parts = []

        for block in content:

            if isinstance(block, dict):

                if block.get("type") == "text":
                    text_parts.append(
                        block.get("text", "")
                    )

            elif isinstance(block, str):

                text_parts.append(block)

        content = "".join(text_parts)

    content = str(content).strip()

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "study_plan": content
    }