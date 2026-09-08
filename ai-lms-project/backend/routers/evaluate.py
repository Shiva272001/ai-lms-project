from fastapi import APIRouter
from pydantic import BaseModel
import json

from llm import get_llm


router = APIRouter(
    prefix="/evaluate",
    tags=["Assignment Evaluation"]
)


class EvalRequest(BaseModel):
    question: str
    student_answer: str
    ideal_answer: str


@router.post("/assignment")
def evaluate_assignment(req: EvalRequest):

    llm = get_llm(temperature=0.2)

    prompt = f"""
You are an educational assignment evaluator.

Evaluate the student's answer by comparing it with the ideal answer.

Question:
{req.question}

Ideal Answer:
{req.ideal_answer}

Student Answer:
{req.student_answer}

IMPORTANT RULES:

1. Give a score from 0 to 10.
2. The score must be a number.
3. Give clear and helpful feedback.
4. Feedback should be exactly 2 short lines.
5. Consider whether the student's answer is correct, partially correct,
   or incorrect.
6. Do not give a score above 10.
7. Do not give a score below 0.
8. Return ONLY valid JSON.
9. Do NOT use markdown.
10. Do NOT use ```json.
11. Do NOT add any explanation outside the JSON.

Return exactly this format:

{{
    "score": 8,
    "feedback": "The answer correctly explains the main idea.\\nAdd more detail about the important concepts."
}}
"""

    try:
        result = llm.invoke(prompt)

        # Get AI response
        content = result.content

        # Handle Gemini/LangChain content blocks
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

        # Convert to string
        content = str(content).strip()

        # Remove markdown code fences if AI adds them
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

        # Find JSON object
        start = content.find("{")
        end = content.rfind("}")

        if start != -1 and end != -1:
            content = content[start:end + 1]

        # Convert JSON string to Python dictionary
        evaluation = json.loads(content)

        # Validate required fields
        if "score" not in evaluation:
            return {
                "result": {
                    "score": 0,
                    "feedback": "The evaluation could not be completed."
                },
                "error": "AI response does not contain score."
            }

        if "feedback" not in evaluation:
            return {
                "result": {
                    "score": evaluation.get("score", 0),
                    "feedback": "No feedback was returned by the AI."
                },
                "error": "AI response does not contain feedback."
            }

        # Make sure score is between 0 and 10
        try:
            score = float(evaluation["score"])
        except (ValueError, TypeError):
            score = 0

        score = max(0, min(10, score))

        # Return clean result
        return {
            "result": {
                "score": score,
                "feedback": evaluation["feedback"]
            }
        }

    except json.JSONDecodeError as e:

        return {
            "result": {
                "score": 0,
                "feedback": "The AI returned an invalid evaluation."
            },
            "error": f"Invalid JSON returned by AI: {str(e)}",
            "raw_response": content
        }

    except Exception as e:

        return {
            "result": {
                "score": 0,
                "feedback": "Unable to evaluate the assignment."
            },
            "error": str(e)
        }