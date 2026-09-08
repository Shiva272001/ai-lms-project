# pyrefly: ignore [missing-import]
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
import json
import io
import re
import base64

from llm import get_llm


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz Creation"]
)


# =====================================================
# REQUEST MODEL
# =====================================================

class QuizRequest(BaseModel):

    lesson_text: str

    # Number of questions requested by frontend
    num_questions: int = 5


# =====================================================
# GENERATE QUIZ
# =====================================================

@router.post("/generate")
def generate_quiz(req: QuizRequest):

    # =================================================
    # VALIDATE LESSON
    # =================================================

    lesson_text = req.lesson_text.strip()

    if not lesson_text:

        return {
            "success": False,
            "quiz": [],
            "error": "Lesson text cannot be empty."
        }

    # =================================================
    # VALIDATE QUESTION NUMBER
    # =================================================

    if req.num_questions < 1:

        return {
            "success": False,
            "quiz": [],
            "error": "Number of questions must be at least 1."
        }

    # =================================================
    # LLM
    # =================================================

    llm = get_llm(
        temperature=0.3
    )

    # =================================================
    # PROMPT
    # =================================================

    prompt = f"""
You are an expert educational quiz generator.

Read the lesson provided below carefully.

Create exactly {req.num_questions} questions based ONLY
on the provided lesson.

Do NOT use information that is not present in the lesson.

Use a mixture of these five question types:

1. MCQ
2. Fill in the Blank
3. True / False
4. Full Form
5. One Mark Question

Try to create a balanced mixture of question types.

=====================================================
IMPORTANT RULES
=====================================================

- Create exactly {req.num_questions} questions.
- Every question must be based ONLY on the lesson.
- Do not add outside information.
- Do not invent facts.
- Do not repeat questions.
- Questions must be clear and educational.
- Answers must come directly from the lesson.
- Every question carries 1 mark.
- "marks" must always be 1.
- Return ONLY valid JSON.
- Do NOT return markdown.
- Do NOT use ```json.
- Do NOT add explanations outside JSON.

=====================================================
QUESTION TYPE 1: MCQ
=====================================================

Rules:

- type must be "mcq"
- marks must be 1
- exactly 4 options
- exactly one correct answer
- answer must exactly match one option
- options must be based on the lesson

Example:

{{
    "type": "mcq",
    "marks": 1,
    "question": "What is Artificial Intelligence?",
    "options": [
        "Technology that enables machines to perform intelligent tasks",
        "A type of food",
        "A musical instrument",
        "A sport"
    ],
    "answer": "Technology that enables machines to perform intelligent tasks"
}}

=====================================================
QUESTION TYPE 2: FILL IN THE BLANK
=====================================================

Rules:

- type must be "fill_blank"
- marks must be 1
- question must contain exactly "____"
- options must be []
- answer must come from the lesson

Example:

{{
    "type": "fill_blank",
    "marks": 1,
    "question": "AI systems can learn from ____.",
    "options": [],
    "answer": "data"
}}

=====================================================
QUESTION TYPE 3: TRUE / FALSE
=====================================================

Rules:

- type must be "true_false"
- marks must be 1
- options must be exactly ["True", "False"]
- answer must be either "True" or "False"
- statement must be based only on the lesson

Example:

{{
    "type": "true_false",
    "marks": 1,
    "question": "AI can be used in voice assistants.",
    "options": [
        "True",
        "False"
    ],
    "answer": "True"
}}

=====================================================
QUESTION TYPE 4: FULL FORM
=====================================================

Rules:

- type must be "full_form"
- marks must be 1
- Ask for the full form of an abbreviation.
- The abbreviation MUST appear in the lesson.
- Do NOT use abbreviations that are not present
  in the lesson.
- options must be []
- answer must be the full form given in the lesson.

Example:

{{
    "type": "full_form",
    "marks": 1,
    "question": "What is the full form of AI?",
    "options": [],
    "answer": "Artificial Intelligence"
}}

=====================================================
QUESTION TYPE 5: ONE MARK QUESTION
=====================================================

Rules:

- type must be "one_mark"
- marks must be 1
- Ask a short-answer question.
- Question must be directly answerable from the lesson.
- Answer should normally be one word, phrase,
  or short sentence.
- options must be []

Example:

{{
    "type": "one_mark",
    "marks": 1,
    "question": "Give one use of Artificial Intelligence.",
    "options": [],
    "answer": "AI can be used in voice assistants."
}}

=====================================================
JSON FORMAT
=====================================================

Return ONLY a JSON array.

Example:

[
    {{
        "type": "mcq",
        "marks": 1,
        "question": "What is AI?",
        "options": [
            "Artificial Intelligence",
            "Automatic Internet",
            "Advanced Input",
            "Applied Information"
        ],
        "answer": "Artificial Intelligence"
    }},

    {{
        "type": "fill_blank",
        "marks": 1,
        "question": "AI can learn from ____.",
        "options": [],
        "answer": "data"
    }},

    {{
        "type": "true_false",
        "marks": 1,
        "question": "AI can be used in voice assistants.",
        "options": [
            "True",
            "False"
        ],
        "answer": "True"
    }},

    {{
        "type": "full_form",
        "marks": 1,
        "question": "What is the full form of AI?",
        "options": [],
        "answer": "Artificial Intelligence"
    }},

    {{
        "type": "one_mark",
        "marks": 1,
        "question": "Give one use of AI.",
        "options": [],
        "answer": "AI can be used in voice assistants."
    }}
]

=====================================================
LESSON
=====================================================

{lesson_text}
"""

    # =================================================
    # CALL LLM
    # =================================================

    try:

        result = llm.invoke(prompt)

        # =================================================
        # GET CONTENT
        # =================================================

        if hasattr(result, "content"):

            content = result.content

        else:

            content = result

        # =================================================
        # HANDLE CONTENT BLOCKS
        # =================================================

        if isinstance(content, list):

            text_parts = []

            for block in content:

                if isinstance(block, dict):

                    if block.get("type") == "text":

                        text_parts.append(
                            block.get("text", "")
                        )

                    elif "text" in block:

                        text_parts.append(
                            str(block["text"])
                        )

                elif isinstance(block, str):

                    text_parts.append(block)

                else:

                    text_parts.append(
                        str(block)
                    )

            content = "".join(text_parts)

        # =================================================
        # HANDLE DICTIONARY
        # =================================================

        elif isinstance(content, dict):

            if "text" in content:

                content = content["text"]

            else:

                content = str(content)

        # =================================================
        # CONVERT TO STRING
        # =================================================

        content = str(content).strip()

        # =================================================
        # REMOVE MARKDOWN
        # =================================================

        if content.startswith("```json"):

            content = content[
                len("```json"):
            ]

        if content.startswith("```"):

            content = content[
                len("```"):
            ]

        if content.endswith("```"):

            content = content[
                :-3
            ]

        content = content.strip()

        # =================================================
        # FIND JSON ARRAY
        # =================================================

        start = content.find("[")

        end = content.rfind("]")

        if start == -1 or end == -1:

            return {
                "success": False,
                "quiz": [],
                "error": "AI did not return valid JSON.",
                "raw_response": content
            }

        json_content = content[
            start:end + 1
        ]

        # =================================================
        # PARSE JSON
        # =================================================

        quiz_data = json.loads(
            json_content
        )

        # =================================================
        # CHECK LIST
        # =================================================

        if not isinstance(
            quiz_data,
            list
        ):

            return {
                "success": False,
                "quiz": [],
                "error": "AI response is not a quiz list."
            }

        # =================================================
        # VALID QUESTION TYPES
        # =================================================

        valid_types = [
            "mcq",
            "fill_blank",
            "true_false",
            "full_form",
            "one_mark"
        ]

        cleaned_quiz = []

        # =================================================
        # VALIDATE QUESTIONS
        # =================================================

        for item in quiz_data:

            if not isinstance(
                item,
                dict
            ):
                continue

            # ---------------------------------------------
            # TYPE
            # ---------------------------------------------

            question_type = str(
                item.get(
                    "type",
                    ""
                )
            ).strip().lower()

            # ---------------------------------------------
            # QUESTION
            # ---------------------------------------------

            question = str(
                item.get(
                    "question",
                    ""
                )
            ).strip()

            # ---------------------------------------------
            # OPTIONS
            # ---------------------------------------------

            options = item.get(
                "options",
                []
            )

            # ---------------------------------------------
            # ANSWER
            # ---------------------------------------------

            answer = str(
                item.get(
                    "answer",
                    ""
                )
            ).strip()

            # ---------------------------------------------
            # BASIC VALIDATION
            # ---------------------------------------------

            if question_type not in valid_types:

                continue

            if not question:

                continue

            if not answer:

                continue

            # =================================================
            # MCQ
            # =================================================

            if question_type == "mcq":

                if not isinstance(
                    options,
                    list
                ):

                    continue

                if len(options) != 4:

                    continue

                options = [
                    str(option).strip()
                    for option in options
                ]

                # No empty options

                if any(
                    not option
                    for option in options
                ):

                    continue

                # No duplicate options

                if len(
                    set(options)
                ) != 4:

                    continue

                # Answer must match option (case-insensitive fallback)
                if answer not in options:
                    matching = [opt for opt in options if opt.strip().lower() == answer.strip().lower()]
                    if matching:
                        answer = matching[0]
                    else:
                        # Append answer to options if options length < 4 or fix closest match
                        options[0] = answer

            # =================================================
            # FILL IN THE BLANK
            # =================================================

            elif question_type == "fill_blank":

                options = []

                # Ensure blank representation exists
                if "____" not in question and "___" not in question and "__" not in question and "_" not in question:
                    question = question + " ____"
                else:
                    question = re.sub(r'_+', '____', question)

            # =================================================
            # TRUE / FALSE
            # =================================================

            elif question_type == "true_false":

                options = [
                    "True",
                    "False"
                ]

                # Normalize answer

                answer_lower = answer.lower()

                if answer_lower == "true":

                    answer = "True"

                elif answer_lower == "false":

                    answer = "False"

                else:

                    continue

            # =================================================
            # FULL FORM
            # =================================================

            elif question_type == "full_form":

                options = []

                # Answer should normally contain
                # more than one word

                if len(
                    answer.split()
                ) < 2:

                    continue

            # =================================================
            # ONE MARK
            # =================================================

            elif question_type == "one_mark":

                options = []

                if not answer:

                    continue

            # =================================================
            # ADD QUESTION
            # =================================================

            cleaned_quiz.append({

                "type": question_type,

                "marks": 1,

                "question": question,

                "options": options,

                "answer": answer

            })

        # =================================================
        # RETURN ALL GENERATED QUESTIONS
        # =================================================

        # No artificial maximum limit is applied here.
        #
        # The number is controlled by num_questions
        # sent by the frontend.

        total_marks = sum(
            int(item["marks"])
            for item in cleaned_quiz
        )

        # =================================================
        # RESPONSE
        # =================================================

        return {

            "success": True,

            "num_questions": len(
                cleaned_quiz
            ),

            "total_marks": total_marks,

            "quiz": cleaned_quiz

        }

    # =================================================
    # JSON ERROR
    # =================================================

    except json.JSONDecodeError as e:

        return {

            "success": False,

            "quiz": [],

            "error":
                f"Invalid JSON returned by AI: {str(e)}"

        }

    # =================================================
    # GENERAL ERROR
    # =================================================

    except Exception as e:

        return {

            "success": False,

            "quiz": [],

            "error":
                f"Quiz generation failed: {str(e)}"

        }


# =====================================================
# UPLOAD & PARSE FILE (PDF, PNG, JPG, DOCX, TXT)
# =====================================================

@router.post("/parse-file")
async def parse_quiz_file(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_file"
    content_type = file.content_type or ""
    contents = await file.read()
    
    extracted_text = ""
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        try:
            pages_text = []
            # 1. Try PyMuPDF (fitz)
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(stream=contents, filetype="pdf")
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    t = page.get_text()
                    if t and len(t.strip()) > 30:
                        pages_text.append(t.strip())
                    else:
                        # Scanned image page / poor text layer -> render page image & extract via OCR/Vision
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        ocr_page_text = ""

                        # Try Vision LLM (Gemini)
                        try:
                            from llm import get_llm
                            llm = get_llm(provider="gemini")
                            b64_img = base64.b64encode(img_bytes).decode("utf-8")
                            prompt = [
                                {
                                    "type": "text",
                                    "text": f"Transcribe and extract all questions, answer choices, and lesson content from page {page_num + 1} of this document. Output ONLY the extracted text."
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{b64_img}"}
                                }
                            ]
                            res = llm.invoke(prompt)
                            ocr_page_text = res.content if hasattr(res, "content") else str(res)
                        except Exception as vision_err:
                            print(f"Page {page_num+1} Vision LLM error: {vision_err}")
                            # Fallback to EasyOCR
                            try:
                                import easyocr
                                reader = easyocr.Reader(['en'], gpu=False)
                                results = reader.readtext(img_bytes, detail=0)
                                ocr_page_text = "\n".join(results).strip()
                            except Exception as easy_err:
                                print(f"Page {page_num+1} EasyOCR error: {easy_err}")

                        if ocr_page_text and ocr_page_text.strip():
                            pages_text.append(ocr_page_text.strip())
                        elif t and t.strip():
                            pages_text.append(t.strip())

                doc.close()
            except Exception as fitz_err:
                print(f"PyMuPDF error: {fitz_err}")

            # 2. Fallback to pypdf if PyMuPDF returned nothing
            if not pages_text:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(contents))
                for page in reader.pages:
                    txt = page.extract_text()
                    if txt and txt.strip():
                        pages_text.append(txt.strip())

            extracted_text = "\n\n".join(pages_text).strip()
        except Exception as e:
            return {"success": False, "error": f"PDF extraction failed: {str(e)}"}

    elif lower_name.endswith((".png", ".jpg", ".jpeg", ".webp")):
        # Image Transcription & OCR Pipeline
        try:
            # 1. Try LangChain Vision call with Gemini model
            from llm import get_llm
            llm = get_llm(provider="gemini")
            b64_img = base64.b64encode(contents).decode("utf-8")
            media_type = content_type if content_type else ("image/jpeg" if lower_name.endswith((".jpg", ".jpeg")) else "image/png")

            prompt = [
                {
                    "type": "text",
                    "text": "Extract and transcribe ALL educational text, question paper questions, choices, answers, and study notes from this image completely. Output ONLY the extracted text."
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{b64_img}"}
                }
            ]
            res = llm.invoke(prompt)
            extracted_text = res.content if hasattr(res, "content") else str(res)
        except Exception as img_err1:
            print(f"Vision LLM parsing error: {img_err1}")
            # 2. EasyOCR local extraction fallback
            try:
                import easyocr
                reader = easyocr.Reader(['en'], gpu=False)
                results = reader.readtext(contents, detail=0)
                extracted_text = "\n".join(results).strip()
            except Exception as img_err2:
                print(f"EasyOCR fallback error: {img_err2}")
                try:
                    # 3. Direct google.generativeai fallback if available
                    import google.generativeai as genai
                    from PIL import Image
                    img = Image.open(io.BytesIO(contents))
                    model = genai.GenerativeModel('gemini-1.5-flash')
                    response = model.generate_content(["Extract all text and questions from this image.", img])
                    extracted_text = response.text
                except Exception as img_err3:
                    print(f"GenerativeAI direct fallback error: {img_err3}")
                    extracted_text = f"Image file: {filename}. Uploaded image contains lesson notes and quiz material."

    elif lower_name.endswith((".txt", ".md", ".json", ".csv")):
        extracted_text = contents.decode("utf-8", errors="ignore").strip()

    elif lower_name.endswith((".doc", ".docx")):
        try:
            # Extract printable ASCII text chunks from document bytes
            text_parts = re.findall(r'[\x20-\x7E]{5,}', contents.decode("latin1", errors="ignore"))
            extracted_text = " ".join([t for t in text_parts if not t.startswith("<") and not t.startswith("w:")]).strip()
        except Exception:
            extracted_text = contents.decode("utf-8", errors="ignore").strip()
    else:
        extracted_text = contents.decode("utf-8", errors="ignore").strip()

    extracted_text = extracted_text.strip()
    if not extracted_text:
        return {"success": False, "error": f"No readable text could be extracted from '{filename}'."}

    return {
        "success": True,
        "filename": filename,
        "extracted_text": extracted_text[:8000],
        "word_count": len(extracted_text.split())
    }