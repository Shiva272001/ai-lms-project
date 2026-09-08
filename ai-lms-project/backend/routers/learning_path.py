from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import json

from llm import get_llm


router = APIRouter(
    prefix="/learning-path",
    tags=["Personalized Learning Path"]
)


class PathRequest(BaseModel):
    student_name: str
    weak_topics: List[str]
    strong_topics: List[str]


@router.post("/generate")
def learning_path(req: PathRequest):

    llm = get_llm(temperature=0.3)

    prompt = f"""
You are an educational AI learning-path planner.

Create a personalized 2-week study roadmap for the student.

Student Name:
{req.student_name}

Weak Topics:
{req.weak_topics}

Strong Topics:
{req.strong_topics}

IMPORTANT RULES:

1. Create exactly 14 days.
2. Give one plan for each day.
3. Focus more study time on weak topics.
4. Use strong topics mainly for revision and practice.
5. Keep the plan realistic for a school student.
6. Include a study topic for every day.
7. Include a short activity for every day.
8. Include an approximate study time.
9. Include a clear goal for every day.
10. Return ONLY valid JSON.
11. Do NOT use markdown.
12. Do NOT use ```json.
13. Do NOT add explanations outside the JSON.

Use exactly this JSON structure:

{{
    "student_name": "{req.student_name}",
    "duration": "2 weeks",
    "roadmap": [
        {{
            "day": 1,
            "topic": "Topic name",
            "focus": "Weak topic",
            "activity": "Practice activity",
            "study_time": "45 minutes",
            "goal": "What the student should achieve"
        }},
        {{
            "day": 2,
            "topic": "Topic name",
            "focus": "Weak topic",
            "activity": "Practice activity",
            "study_time": "45 minutes",
            "goal": "What the student should achieve"
        }}
    ]
}}

Make sure the roadmap contains exactly 14 days.

Weak topics should receive more attention than strong topics.
"""


    try:

        result = llm.invoke(prompt)

        # =====================================================
        # GET AI RESPONSE
        # =====================================================

        content = result.content

        # =====================================================
        # HANDLE LANGCHAIN CONTENT BLOCKS
        # =====================================================

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

        # =====================================================
        # CLEAN RESPONSE
        # =====================================================

        content = str(content).strip()

        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

        # =====================================================
        # FIND JSON OBJECT
        # =====================================================

        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end != -1:
            content = content[start:end + 1]

        # =====================================================
        # CONVERT JSON
        # =====================================================

        learning_data = json.loads(content)

        # =====================================================
        # VALIDATE ROADMAP
        # =====================================================

        if not isinstance(learning_data, dict):

            return {
                "learning_path": {},
                "error": "AI did not return a valid learning path."
            }

        roadmap = learning_data.get("roadmap", [])

        if not isinstance(roadmap, list):

            return {
                "learning_path": {},
                "error": "Roadmap is not a valid list."
            }

        # =====================================================
        # RETURN RESULT
        # =====================================================

        return {
            "learning_path": learning_data
        }

    except json.JSONDecodeError as e:

        return {
            "learning_path": {},
            "error": f"Invalid JSON returned by AI: {str(e)}",
            "raw_response": content
        }

    except Exception as e:

        return {
            "learning_path": {},
            "error": str(e)
        }