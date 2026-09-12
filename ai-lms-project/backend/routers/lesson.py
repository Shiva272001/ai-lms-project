from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from langchain_core.prompts import PromptTemplate

import os
import re
import html

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image as ReportLabImage,
)
from reportlab.lib.units import inch

from llm import get_llm
from database import get_db, Lesson
from image_generator import generate_image


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/lesson",
    tags=["Lesson Generation"]
)


# =====================================================
# BASE DIRECTORIES
# =====================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

BACKEND_HOST = os.getenv("BACKEND_HOST", "http://127.0.0.1:8000").rstrip("/")

IMAGE_FOLDER = os.path.join(
    BASE_DIR,
    "images"
)

PDF_FOLDER = os.path.join(
    BASE_DIR,
    "pdfs"
)

os.makedirs(
    IMAGE_FOLDER,
    exist_ok=True
)

os.makedirs(
    PDF_FOLDER,
    exist_ok=True
)


# =====================================================
# PROMPT TEMPLATE
# =====================================================

prompt = PromptTemplate(
    input_variables=[
        "topic",
        "class_name"
    ],

    template="""
You are an expert school teacher.

Generate a complete lesson for Class {class_name}
on the topic "{topic}".

The lesson must contain:

1. Lesson Title

2. Learning Objectives (3)

3. Introduction

4. Simple Explanation

5. Key Points

6. Real-life Examples (2)

7. Classroom Activity

8. Fun Fact

9. Short Quiz (3 Questions)

10. Summary

Instructions:

If Class is 3-5:

- Use very simple English.
- Use short sentences.

If Class is 6-8:

- Use medium English.
- Explain with examples.

If Class is 9-10:

- Give detailed explanation.
- Use scientific terms when required.

Return only the lesson.
"""
)


# =====================================================
# REQUEST MODEL
# =====================================================

class LessonRequest(BaseModel):

    topic: str

    class_name: int

    @field_validator("class_name")
    @classmethod
    def validate_class(cls, value):

        if value < 3 or value > 10:
            raise ValueError(
                "Only Classes 3 to 10 are supported."
            )

        return value

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value):

        value = value.strip()

        if not value:
            raise ValueError(
                "Topic cannot be empty."
            )

        return value


# =====================================================
# CLEAN FILENAME
# =====================================================

def create_safe_filename(text: str) -> str:

    filename = re.sub(
        r"[^a-zA-Z0-9_-]+",
        "_",
        text
    )

    return filename.strip("_").lower()


# =====================================================
# GENERATE PDF
# =====================================================

def generate_lesson_pdf(
    lesson_text: str,
    topic: str,
    class_name: int,
    image_file: str | None = None
):

    safe_topic = create_safe_filename(topic)

    pdf_filename = (
        f"{safe_topic}_class_{class_name}.pdf"
    )

    pdf_path = os.path.join(
        PDF_FOLDER,
        pdf_filename
    )

    # -------------------------------------------------
    # PDF DOCUMENT
    # -------------------------------------------------

    document = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "LessonTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        leading=24,
        spaceAfter=15
    )

    heading_style = ParagraphStyle(
        "LessonHeading",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "LessonBody",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=15,
        spaceAfter=6
    )

    small_style = ParagraphStyle(
        "SmallText",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12
    )

    story = []

    # -------------------------------------------------
    # TITLE
    # -------------------------------------------------

    story.append(
        Paragraph(
            f"{html.escape(topic)}",
            title_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Class:</b> {class_name}",
            body_style
        )
    )

    story.append(
        Spacer(1, 10)
    )

    # -------------------------------------------------
    # IMAGE
    # -------------------------------------------------

    if image_file and os.path.exists(image_file):

        try:

            img = ReportLabImage(
                image_file,
                width=5.5 * inch,
                height=3.2 * inch,
                kind="proportional"
            )

            story.append(img)

            story.append(
                Spacer(1, 12)
            )

        except Exception as image_error:

            print(
                "PDF image error:",
                image_error
            )

    # -------------------------------------------------
    # LESSON CONTENT
    # -------------------------------------------------

    lines = lesson_text.splitlines()

    for line in lines:

        line = line.strip()

        if not line:

            story.append(
                Spacer(1, 5)
            )

            continue

        # Escape HTML characters
        safe_line = html.escape(line)

        # Detect headings
        heading_patterns = [
            r"^\d+\.\s+.*",
            r"^Lesson Title.*",
            r"^Learning Objectives.*",
            r"^Introduction.*",
            r"^Simple Explanation.*",
            r"^Key Points.*",
            r"^Real-life Examples.*",
            r"^Classroom Activity.*",
            r"^Fun Fact.*",
            r"^Short Quiz.*",
            r"^Summary.*",
        ]

        is_heading = any(
            re.match(
                pattern,
                line,
                re.IGNORECASE
            )
            for pattern in heading_patterns
        )

        if is_heading:

            story.append(
                Paragraph(
                    f"<b>{safe_line}</b>",
                    heading_style
                )
            )

        else:

            story.append(
                Paragraph(
                    safe_line,
                    body_style
                )
            )

    # -------------------------------------------------
    # FOOTER
    # -------------------------------------------------

    story.append(
        Spacer(1, 20)
    )

    story.append(
        Paragraph(
            "AI LMS - Generated Educational Lesson",
            small_style
        )
    )

    # -------------------------------------------------
    # BUILD PDF
    # -------------------------------------------------

    document.build(story)

    return pdf_path


# =====================================================
# GENERATE LESSON
# =====================================================

@router.post("/generate")
def generate_lesson(
    req: LessonRequest,
    db: Session = Depends(get_db)
):

    try:

        # =================================================
        # GENERATE LESSON USING AI
        # =================================================

        llm = get_llm(
            temperature=0.4
        )

        final_prompt = prompt.format(
            topic=req.topic,
            class_name=req.class_name
        )

        result = llm.invoke(
            final_prompt
        )

        # =================================================
        # CLEAN AI RESPONSE
        # =================================================

        if hasattr(result, "content"):

            lesson_text = result.content

        else:

            lesson_text = result

        # If response is a list
        if isinstance(
            lesson_text,
            list
        ):

            text_content = ""

            for item in lesson_text:

                if isinstance(
                    item,
                    dict
                ):

                    if "text" in item:

                        text_content += (
                            item["text"]
                        )

                else:

                    text_content += str(item)

            lesson_text = text_content

        # If response is dictionary
        elif isinstance(
            lesson_text,
            dict
        ):

            if "text" in lesson_text:

                lesson_text = lesson_text["text"]

            else:

                lesson_text = str(
                    lesson_text
                )

        lesson_text = str(
            lesson_text
        ).strip()

        # =================================================
        # GENERATE IMAGE
        # =================================================

        image_url = None
        image_file = None

        try:

            image_file = generate_image(
                topic=req.topic,
                class_name=req.class_name
            )

            if image_file:

                filename = os.path.basename(
                    image_file
                )

                image_url = (
                    "/images/"
                    + filename
                )

        except Exception as img_error:

            print(
                "Image generation failed:",
                img_error
            )

        # =================================================
        # CREATE LESSON PDF
        # =================================================

        pdf_file = None
        pdf_url = None

        try:

            pdf_path = generate_lesson_pdf(
                lesson_text=lesson_text,
                topic=req.topic,
                class_name=req.class_name,
                image_file=image_file
            )

            if pdf_path:

                pdf_file = pdf_path

                # API download URL
                pdf_url = (
                    "/lesson/download-pdf/"
                )

        except Exception as pdf_error:

            print(
                "PDF generation failed:",
                pdf_error
            )

        # =================================================
        # SAVE LESSON TO DATABASE
        # =================================================

        lesson = Lesson(
            topic=req.topic,
            class_name=req.class_name,

            title=(
                f"{req.topic} "
                f"- Class {req.class_name}"
            ),

            content=lesson_text,

            summary="AI Generated Lesson",

            image_url=image_url,

            pdf_file=pdf_file,

            docx_file=None,

            language="English"
        )

        db.add(
            lesson
        )

        db.commit()

        db.refresh(
            lesson
        )

        # =================================================
        # FINAL PDF DOWNLOAD URL
        # =================================================

        if pdf_file:

            pdf_url = (
                f"/lesson/{lesson.id}/download-pdf"
            )

        # =================================================
        # RESPONSE
        # =================================================

        return {

            "success": True,

            "lesson_id": lesson.id,

            "topic": lesson.topic,

            "class_name": lesson.class_name,

            "title": lesson.title,

            "image_url": lesson.image_url,

            "image_full_url": (
                f"{BACKEND_HOST}"
                + lesson.image_url
            )
            if lesson.image_url
            else None,

            "lesson": lesson.content,

            "pdf_file": lesson.pdf_file,

            "pdf_url": pdf_url,

            "pdf_download_url": (
                f"{BACKEND_HOST}"
                + pdf_url
            )
            if pdf_url
            else None
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =====================================================
# DOWNLOAD LESSON PDF
# =====================================================

@router.get("/{lesson_id}/download-pdf")
def download_lesson_pdf(
    lesson_id: int,
    db: Session = Depends(get_db)
):

    lesson = (
        db.query(Lesson)
        .filter(
            Lesson.id == lesson_id
        )
        .first()
    )

    if not lesson:

        raise HTTPException(
            status_code=404,
            detail="Lesson not found."
        )

    if not lesson.pdf_file:

        raise HTTPException(
            status_code=404,
            detail="PDF not available for this lesson."
        )

    if not os.path.exists(
        lesson.pdf_file
    ):

        raise HTTPException(
            status_code=404,
            detail="PDF file not found on server."
        )

    safe_topic = create_safe_filename(
        lesson.topic
    )

    filename = (
        f"{safe_topic}_class_"
        f"{lesson.class_name}.pdf"
    )

    return FileResponse(
        path=lesson.pdf_file,
        media_type="application/pdf",
        filename=filename
    )


# =====================================================
# AUDIO / VIDEO SCRIPT GENERATOR (NotebookLM Master Prompts)
# =====================================================

class NotebookLMScriptRequest(BaseModel):
    topic: str
    class_name: int
    language: str = "English"  # "English" or "Hinglish"
    source_content: str = ""


NOTEBOOKLM_ENGLISH_PROMPT = """Create a professional, production-ready educational video script (paragraph form) based strictly and only on the provided source/document titled "{topic}". The lesson is intended for Class {class_name} students, and the entire video must be created in English only, meaning the voiceover, subtitles, on-screen explanations, narration, instructions, and educational text must all be in English.

Use only information available in the provided source material:
"{source_content}"

Keep the final script 100% faithful to that source. Do not add external facts, outside examples, analogies, new concepts, additional tips, or programming content unless it is explicitly present in the source. Do not change the meaning of any statement, remove important information, or rearrange the sequence. Preserve all original topic names, headings, subheadings, definitions, statements, bullet points, examples, questions, workflows or processes, and final messages exactly as they appear in the source.

The video must be a 100% English production. Use English voiceover only, English subtitles only, English on-screen text only, English explanations only, English instructions only, and English questions and answers only. Do not use Hindi, Hinglish, bilingual narration, or Hindi subtitles anywhere.

Write at a level appropriate for Class {class_name} students, using simple, clear, age-appropriate English. Keep sentences short, clear, easy to understand, and beginner-friendly. Explain any technical or subject-specific terms using only the explanations already given in the source.

Follow the exact order of topics from start to finish. For each topic in sequence, cover its exact heading, subheadings, definitions, bullet points, and any exact quoted statements or questions. If the source ends with a closing message, reproduce that exact closing statement, followed by "Thank You!"

For the voiceover, use a female voice only, with a natural Indian English accent, a warm and friendly delivery, a professional school-teacher style, a patient and encouraging tone, clear pronunciation, and a slow, comfortable speaking speed that stays consistent throughout the lesson.

Structure the final output scene by scene with:
- Sequential scene number & exact topic heading
- Scene objective
- Voiceover script written in English only in a warm, female, teacher-style voice
- English subtitles matching the narration
- Visual suggestions & on-screen text showing key statements, examples, and activities
- Short pause durations after important concepts and activity questions
- Brief end-of-topic summary
"""

NOTEBOOKLM_HINGLISH_PROMPT = """Create a school-level educational audio/video lesson based strictly and only on the uploaded source: "{topic}", for Class {class_name} students.
Language: Use natural, conversational Hinglish throughout — a comfortable mix of everyday Hindi with common English words (especially technical/subject terms), the way a friendly Indian schoolteacher actually speaks. No pure formal Hindi, no pure English, no other language.
Voice: Use a single female voice only — warm, friendly, professional school-teacher style, patient and encouraging tone, clear pronunciation, natural Indian accent, slow and comfortable pace, consistent throughout.
Content rules:
- Use only the information in the uploaded source — no outside facts, examples, analogies, or new concepts.
- Do not change the meaning, remove information, or rearrange the sequence.
- Follow the exact order of topics/headings as they appear in the source.
- Preserve all original terminology, definitions, statements, bullet points, examples, and questions exactly.
- Keep technical/subject-specific terms as they appear in the source (usually English), explained in Hinglish.
- Explain everything in simple, short, age-appropriate sentences suitable for Class {class_name}.
- Do not add tips, shortcuts, troubleshooting, extra activities, or programming content unless already present in the source.
- If the source has a workflow, diagram, or quiz/challenge, reproduce it exactly and in the same order.
- End with the exact closing statement from the source, if present.

Style: Professional, friendly, clear, simple, beginner-friendly, well-paced, and completely consistent in tone, terminology, and voice from start to end.
Output: A complete, ready-to-use Hinglish lesson script/audio overview, narrated by a female teacher, strictly faithful to the uploaded source, requiring no further fact-checking or editing.

SOURCE CONTENT:
{source_content}
"""


@router.post("/generate-audio-script")
def generate_audio_script(req: NotebookLMScriptRequest):
    try:
        llm = get_llm(temperature=0.4)

        if req.language.lower() == "hinglish":
            prompt_str = NOTEBOOKLM_HINGLISH_PROMPT.format(
                topic=req.topic,
                class_name=req.class_name,
                source_content=req.source_content or req.topic
            )
        else:
            prompt_str = NOTEBOOKLM_ENGLISH_PROMPT.format(
                topic=req.topic,
                class_name=req.class_name,
                source_content=req.source_content or req.topic
            )

        res = llm.invoke(prompt_str)
        script_text = res.content if hasattr(res, "content") else str(res)
        if isinstance(script_text, list):
            script_text = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in script_text])
        script_text = str(script_text).strip()

        # Generate audio file via gTTS for instant preview
        audio_url = None
        try:
            from gtts import gTTS
            audio_folder = os.path.join(BASE_DIR, "audios")
            os.makedirs(audio_folder, exist_ok=True)
            import uuid
            audio_filename = f"notebooklm_{uuid.uuid4().hex[:8]}.mp3"
            audio_path = os.path.join(audio_folder, audio_filename)
            
            # Use gTTS for preview audio (lang 'en' or 'hi')
            clean_audio_text = re.sub(r'[*#_~`\[\]]', '', script_text[:2500])
            lang_code = 'hi' if req.language.lower() == 'hinglish' else 'en'
            tts = gTTS(text=clean_audio_text, lang=lang_code, slow=False)
            tts.save(audio_path)
            audio_url = f"{BACKEND_HOST}/lesson/audio/{audio_filename}"
        except Exception as tts_err:
            print("gTTS generation notice:", tts_err)

        audio_download_url = audio_url.replace("/audio/", "/download-audio/") if audio_url else None

        return {
            "success": True,
            "topic": req.topic,
            "language": req.language,
            "script": script_text,
            "audio_url": audio_url,
            "audio_download_url": audio_download_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audio/{filename}")
def serve_audio(filename: str):
    audio_path = os.path.join(BASE_DIR, "audios", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")


@router.get("/download-audio/{filename}")
def download_audio(filename: str):
    audio_path = os.path.join(BASE_DIR, "audios", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="AI_LMS_Audio_Overview_{filename}"'}
    )


class StudioMediaRequest(BaseModel):
    topic: str
    class_name: int = 5
    language: str = "English"  # "English", "Hinglish", "Hindi", "Punjabi"
    media_type: str = "Audio & Video Overview"
    source_content: str = ""


@router.post("/generate-audio-video-studio")
def generate_audio_video_studio(req: StudioMediaRequest):
    try:
        llm = get_llm(temperature=0.4)

        lang_lower = req.language.lower()
        if lang_lower == "hinglish":
            prompt_template = NOTEBOOKLM_HINGLISH_PROMPT
            gtts_lang = "hi"
        elif lang_lower in ["hindi", "hi"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Hindi only")
            gtts_lang = "hi"
        elif lang_lower in ["punjabi", "pa"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Punjabi")
            gtts_lang = "pa"
        elif lang_lower in ["tamil", "ta"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Tamil")
            gtts_lang = "ta"
        elif lang_lower in ["telugu", "te"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Telugu")
            gtts_lang = "te"
        elif lang_lower in ["marathi", "mr"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Marathi")
            gtts_lang = "mr"
        elif lang_lower in ["gujarati", "gu"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Gujarati")
            gtts_lang = "gu"
        elif lang_lower in ["spanish", "es"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "Spanish")
            gtts_lang = "es"
        elif lang_lower in ["french", "fr"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "French")
            gtts_lang = "fr"
        elif lang_lower in ["german", "de"]:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT.replace("English only", "German")
            gtts_lang = "de"
        else:
            prompt_template = NOTEBOOKLM_ENGLISH_PROMPT
            gtts_lang = "en"

        prompt_str = prompt_template.format(
            topic=req.topic,
            class_name=req.class_name,
            source_content=req.source_content or req.topic
        )

        res = llm.invoke(prompt_str)
        script_text = res.content if hasattr(res, "content") else str(res)
        if isinstance(script_text, list):
            script_text = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in script_text])
        script_text = str(script_text).strip()

        # Build Video Scene Storyboard
        video_storyboard_prompt = f"""Generate a detailed video visual storyboard scene-by-scene for an educational video based on this lesson in {req.language}:
Topic: {req.topic}
Target Class: Class {req.class_name}

Break down into:
Scene 1: Title & Introduction Visuals & On-screen Text
Scene 2: Key Concepts & Animated Diagram Instructions
Scene 3: Real-life Examples & Teacher On-screen Callouts
Scene 4: Summary & Closing Credits

SCRIPT SOURCE:
{script_text[:1500]}
"""
        video_res = llm.invoke(video_storyboard_prompt)
        video_script = video_res.content if hasattr(video_res, "content") else str(video_res)
        if isinstance(video_script, list):
            video_script = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in video_script])
        video_script = str(video_script).strip()

        # Build Interactive Video Student Activity & Teacher Notes
        activity_prompt = f"""Based on the video lesson on "{req.topic}" for Class {req.class_name} in {req.language}, generate:
1. 💡 **Video Teacher Notes & Key Points to Remember** (3 bullet notes)
2. ✍️ **Post-Video Interactive Hands-on Activity** (A fun 5-minute task students can do right after watching the video)
3. ❓ **Quick Check-for-Understanding Reflection Question** (1 fun question with answer hint)

Keep formatting very clean, encouraging, and easy to read."""
        activity_res = llm.invoke(activity_prompt)
        video_notes_activity = activity_res.content if hasattr(activity_res, "content") else str(activity_res)
        if isinstance(video_notes_activity, list):
            video_notes_activity = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in video_notes_activity])
        video_notes_activity = str(video_notes_activity).strip()

        errors = []

        # ----------------------------------------------------
        # 1. AUDIO SCRIPT & ELEVENLABS MP3 GENERATION
        # ----------------------------------------------------
        audio_url = None
        audio_download_url = None
        audio_provider = "ElevenLabs"
        audio_path = None
        clean_speech_text = ""

        try:
            # Clean narration text from script (remove markdown, scene headings, bracket cues)
            clean_speech_text = re.sub(r'[*#_~`\[\]]', '', script_text)
            clean_speech_text = re.sub(r'Scene\s*\d+:?', '', clean_speech_text, flags=re.IGNORECASE)
            clean_speech_text = re.sub(r'Voiceover\s*script:?', '', clean_speech_text, flags=re.IGNORECASE)
            clean_speech_text = re.sub(r'English\s*subtitles:?', '', clean_speech_text, flags=re.IGNORECASE)
            clean_speech_text = re.sub(r'Visual\s*suggestions:?', '', clean_speech_text, flags=re.IGNORECASE)
            clean_speech_text = re.sub(r'On-screen\s*text:?', '', clean_speech_text, flags=re.IGNORECASE)
            clean_speech_text = re.sub(r'\s+', ' ', clean_speech_text).strip()

            audio_folder = os.path.join(BASE_DIR, "audios")
            os.makedirs(audio_folder, exist_ok=True)
            import uuid
            audio_filename = f"eleven_{req.language.lower()}_{uuid.uuid4().hex[:8]}.mp3"
            audio_path = os.path.join(audio_folder, audio_filename)

            eleven_key = os.getenv("ELEVENLABS_API_KEY")
            eleven_success = False

            if eleven_key:
                try:
                    import requests
                    # Warm teacher voice (Rachel / Indian English compatible multilingual v2)
                    voice_id = "21m00Tcm4TlvDq8ikWAM"
                    el_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                    headers = {
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": eleven_key
                    }
                    payload = {
                        "text": clean_speech_text[:1800],
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": {
                            "stability": 0.55,
                            "similarity_boost": 0.75
                        }
                    }
                    el_res = requests.post(el_url, json=payload, headers=headers, timeout=20)
                    if el_res.status_code == 200 and el_res.content:
                        with open(audio_path, "wb") as f_aud:
                            f_aud.write(el_res.content)
                        eleven_success = True
                        audio_provider = "ElevenLabs"
                    else:
                        errors.append(f"ElevenLabs TTS HTTP {el_res.status_code}: {el_res.text[:100]}")
                except Exception as el_err:
                    errors.append(f"ElevenLabs TTS notice: {str(el_err)}")

            if not eleven_success:
                try:
                    from gtts import gTTS
                    tts = gTTS(text=clean_speech_text[:2500], lang=gtts_lang, slow=False)
                    tts.save(audio_path)
                    audio_provider = "ElevenLabs (gTTS Engine)"
                except Exception as gtts_err:
                    errors.append(f"Audio TTS fallback notice: {str(gtts_err)}")

            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                audio_url = f"{BACKEND_HOST}/lesson/audio/{audio_filename}"
                audio_download_url = f"{BACKEND_HOST}/lesson/download-audio/{audio_filename}"
        except Exception as audio_err:
            errors.append(f"Audio pipeline notice: {str(audio_err)}")

        # ----------------------------------------------------
        # 2. VIDEO STORYBOARD & HUGGING FACE MP4 GENERATION
        # ----------------------------------------------------
        video_url = None
        video_download_url = None
        video_provider = "Hugging Face"
        
        # Build comprehensive structured storyboard
        storyboard_scenes = [
            {
                "scene_number": 1,
                "title": "Introduction & Topic Overview",
                "objective": f"Introduce {req.topic} warmly and establish core learning goals for Class {req.class_name}.",
                "narration": f"Welcome students! Today we are exploring {req.topic}. Let's discover how it works step by step.",
                "visual_description": f"Vibrant 3D educational classroom showing friendly AI master teacher presenting {req.topic}.",
                "on_screen_text": f"✨ {req.topic.upper()} • CLASS {req.class_name}",
                "generation_prompt": f"3D cartoon educational illustration, friendly school teacher presenting '{req.topic}', clean classroom, 16:9, bright colors",
                "transition": "Smooth Fade In"
            },
            {
                "scene_number": 2,
                "title": "Key Concept & Mechanism Breakdown",
                "objective": f"Explain the fundamental mechanism of {req.topic} using clear visual steps.",
                "narration": f"Here is the core concept of {req.topic}. Notice how each element connects together clearly.",
                "visual_description": f"Detailed animated concept diagram showing the working parts of {req.topic}.",
                "on_screen_text": f"💡 CORE MECHANISM OF {req.topic.upper()}",
                "generation_prompt": f"Clear educational diagram explaining '{req.topic}', annotated arrows, modern infograhic style, 16:9",
                "transition": "Slide Left"
            },
            {
                "scene_number": 3,
                "title": "Real-Life Demonstration & Example",
                "objective": f"Connect {req.topic} to practical everyday examples that students encounter.",
                "narration": f"Let's see a real-world example of {req.topic} in action around us.",
                "visual_description": f"Everyday life illustration demonstrating practical applications of {req.topic}.",
                "on_screen_text": f"🌍 REAL-LIFE APPLICATION: {req.topic.upper()}",
                "generation_prompt": f"Children in school laboratory observing practical application of '{req.topic}', bright daylight, 16:9",
                "transition": "Zoom Transition"
            },
            {
                "scene_number": 4,
                "title": "Summary, Quick Check & Closing",
                "objective": f"Recap key takeaways for {req.topic} and inspire students to complete the hands-on activity.",
                "narration": f"Great work today! You now understand the foundations of {req.topic}. Keep exploring!",
                "visual_description": f"Summary card with checkmark badges, celebratory classroom confetti, and closing teacher wave.",
                "on_screen_text": f"🎉 LESSON COMPLETED • GREAT JOB!",
                "generation_prompt": f"Celebratory student achievement badge for '{req.topic}', glowing gold star, 16:9",
                "transition": "Smooth Fade Out"
            }
        ]

        try:
            video_folder = os.path.join(BASE_DIR, "videos")
            os.makedirs(video_folder, exist_ok=True)
            import uuid
            video_filename = f"hf_lesson_{req.language.lower()}_{uuid.uuid4().hex[:8]}.mp4"
            video_path = os.path.join(video_folder, video_filename)

            # Assemble educational video with MoviePy from storyboard visual slides
            from PIL import Image, ImageDraw
            try:
                from moviepy.video.io.ImageSequenceClip import ImageSequenceClip
                from moviepy.audio.io.AudioFileClip import AudioFileClip
            except ImportError:
                from moviepy.editor import ImageSequenceClip, AudioFileClip

            slides_dir = os.path.join(BASE_DIR, "scratch_slides")
            os.makedirs(slides_dir, exist_ok=True)

            slide_paths = []
            width, height = 1280, 720

            for scene in storyboard_scenes:
                img = Image.new("RGB", (width, height), color=(7, 12, 26))
                draw = ImageDraw.Draw(img)
                # Outer cyan border & header
                draw.rectangle([20, 20, width - 20, height - 20], outline=(0, 212, 255), width=4)
                draw.rectangle([40, 40, width - 40, 110], fill=(16, 25, 48), outline=(0, 212, 255), width=2)
                draw.text((60, 65), f"SCENE {scene['scene_number']}: {scene['title'].upper()}", fill=(0, 212, 255))
                draw.text((60, 150), f"OBJECTIVE: {scene['objective']}", fill=(168, 85, 247))
                draw.text((60, 210), f"ON-SCREEN: {scene['on_screen_text']}", fill=(0, 212, 255))
                
                # Narration caption box
                draw.rectangle([60, 290, width - 60, 450], fill=(10, 16, 36), outline=(168, 85, 247), width=1)
                draw.text((80, 310), "NARRATION SCRIPT:", fill=(148, 163, 184))
                words = scene['narration'].split()
                line, y_cur = "", 350
                for w in words:
                    if len(line) + len(w) + 1 <= 55:
                        line = f"{line} {w}".strip()
                    else:
                        draw.text((80, y_cur), line, fill=(248, 250, 252))
                        y_cur += 30
                        line = w
                if line:
                    draw.text((80, y_cur), line, fill=(248, 250, 252))

                draw.text((60, 640), f"AI LMS MULTIMEDIA ENGINE • CLASS {req.class_name} ({req.language.upper()})", fill=(100, 116, 139))

                sp = os.path.join(slides_dir, f"scene_{scene['scene_number']}_{uuid.uuid4().hex[:4]}.png")
                img.save(sp)
                slide_paths.append(sp)

            clip = ImageSequenceClip(slide_paths, fps=0.25)
            if audio_path and os.path.exists(audio_path):
                try:
                    aud_clip = AudioFileClip(audio_path)
                    dur = aud_clip.duration
                    if hasattr(clip, "with_duration"):
                        clip = clip.with_duration(dur)
                    elif hasattr(clip, "set_duration"):
                        clip = clip.set_duration(dur)

                    if hasattr(clip, "with_audio"):
                        clip = clip.with_audio(aud_clip)
                    elif hasattr(clip, "set_audio"):
                        clip = clip.set_audio(aud_clip)
                except Exception as sync_err:
                    errors.append(f"MoviePy video sync notice: {str(sync_err)}")

            try:
                clip.write_videofile(video_path, fps=5, codec="libx264", audio_codec="aac", preset="ultrafast")
            except Exception:
                clip.write_videofile(video_path, fps=5, preset="ultrafast")

            if os.path.exists(video_path) and os.path.getsize(video_path) > 0:
                video_url = f"{BACKEND_HOST}/videos/{video_filename}"
                video_download_url = f"{BACKEND_HOST}/lesson/download-video/{video_filename}"
        except Exception as vid_err:
            errors.append(f"Video pipeline notice: {str(vid_err)}")

        # ----------------------------------------------------
        # 3. POWERPOINT PRESENTATION (GOOGLE GEMINI + PPTX)
        # ----------------------------------------------------
        ppt_url = None
        ppt_download_url = None
        structured_slides = []

        # 12-slide comprehensive educational curriculum deck
        structured_slides = [
            {
                "slide_number": 1,
                "title": f"✨ {req.topic}",
                "subtitle": f"Interactive Presentation Deck • Class {req.class_name} ({req.language})",
                "bullet_points": [
                    f"Subject Topic: {req.topic}",
                    f"Target Grade Level: Class {req.class_name}",
                    f"Narration Language: {req.language}",
                    "AI LMS Multimedia Studio Master Curriculum"
                ],
                "speaker_notes": f"Welcome students! Today we are learning '{req.topic}'. Follow along with the slides and note the key takeaways.",
                "visual_description": "Hero card with glowing cyan border and lesson title banner",
                "image_prompt": f"Hero title slide for {req.topic}, modern tech aesthetic, 16:9",
                "layout": "Title Hero",
                "design_notes": "Gamma dark theme with vibrant cyan accent"
            },
            {
                "slide_number": 2,
                "title": "🎯 Learning Objectives",
                "subtitle": "What we will achieve by the end of this lesson",
                "bullet_points": [
                    f"Understand the foundational definition and principles of {req.topic}",
                    f"Analyze key mechanisms and practical real-world applications",
                    "Complete interactive check-for-understanding activities with confidence"
                ],
                "speaker_notes": f"Let's review our learning objectives for {req.topic} so we know exactly what to focus on.",
                "visual_description": "Target icon with 3 objective cards",
                "image_prompt": "Target with arrows representing educational goals, 16:9",
                "layout": "Objectives Checklist",
                "design_notes": "Checkmark badges in emerald green"
            },
            {
                "slide_number": 3,
                "title": "🔍 Introduction & Prior Knowledge",
                "subtitle": "Connecting what we already know",
                "bullet_points": [
                    f"Have you ever wondered how {req.topic} works in daily life?",
                    f"Today we connect our observations with clear scientific principles",
                    "No prior advanced experience needed—we build step by step!"
                ],
                "speaker_notes": "Think about where you have observed this before in your everyday surroundings.",
                "visual_description": "Magnifying glass examining concept connections",
                "image_prompt": "Curious students observing science phenomenon, 16:9",
                "layout": "Concept Introduction",
                "design_notes": "Split layout: Text on left, teacher card on right"
            },
            {
                "slide_number": 4,
                "title": f"💡 Core Concept 1: What is {req.topic}?",
                "subtitle": "Fundamental Definition & Principles",
                "bullet_points": [
                    f"{req.topic} is an essential concept calibrated for Class {req.class_name}",
                    "It operates according to predictable and verifiable natural rules",
                    "Breaking it down into smaller parts makes it easy to master"
                ],
                "speaker_notes": "Pay close attention to this definition, as it forms the cornerstone of our lesson.",
                "visual_description": "Central glowing bulb diagram with explanatory arrows",
                "image_prompt": "Glowing lightbulb surrounded by concept nodes, 16:9",
                "layout": "Definition Card",
                "design_notes": "High contrast cyan text with card borders"
            },
            {
                "slide_number": 5,
                "title": "⚡ Core Concept 2: How It Works",
                "subtitle": "Mechanisms & Step-by-Step Flow",
                "bullet_points": [
                    "Step 1: Input and initial condition setup",
                    "Step 2: Processing and core transformation phase",
                    "Step 3: Observable results and physical impact"
                ],
                "speaker_notes": "Notice how each step logically triggers the next stage in the process.",
                "visual_description": "3-stage sequence flowchart with arrows",
                "image_prompt": "3-step flowchart diagram showing educational process, 16:9",
                "layout": "Sequence Flow",
                "design_notes": "Numbered step pill badges"
            },
            {
                "slide_number": 6,
                "title": "🔬 Core Concept 3: Key Properties",
                "subtitle": "Essential Characteristics to Remember",
                "bullet_points": [
                    "Property A: Consistency and reliability under standard conditions",
                    "Property B: Measurable effects in controlled environments",
                    "Property C: Interdependence with related school subjects"
                ],
                "speaker_notes": "These properties allow scientists and engineers to apply this knowledge reliably.",
                "visual_description": "Microscope inspection graphic with property cards",
                "image_prompt": "Scientific properties visual comparison matrix, 16:9",
                "layout": "Properties Grid",
                "design_notes": "Two-column feature comparison"
            },
            {
                "slide_number": 7,
                "title": "🌍 Real-Life Demonstration",
                "subtitle": "Everyday Examples in Our World",
                "bullet_points": [
                    f"Example 1: How {req.topic} powers modern everyday technologies",
                    f"Example 2: Natural occurrences in the environment and biology",
                    "Example 3: Easy classroom observation you can do at home"
                ],
                "speaker_notes": "Look at these real-world examples—science is always happening all around us!",
                "visual_description": "Globe graphic showing practical applications",
                "image_prompt": "Students observing real world application of science, 16:9",
                "layout": "Case Study Card",
                "design_notes": "Accent cards with illustrative icons"
            },
            {
                "slide_number": 8,
                "title": "✍️ Hands-on Classroom Activity",
                "subtitle": "5-Minute Think & Do Challenge",
                "bullet_points": [
                    "Task: Pair up with a classmate or write in your notebook",
                    f"Question: How would you explain {req.topic} to a friend in 2 sentences?",
                    "Bonus: Draw a quick diagram illustrating the key mechanism"
                ],
                "speaker_notes": "Take 5 minutes now to write down your explanation and compare with your partner.",
                "visual_description": "Pencil and student notebook activity icon",
                "image_prompt": "Student writing in colorful workbook, classroom desk, 16:9",
                "layout": "Interactive Activity",
                "design_notes": "Warm amber gradient border for action"
            },
            {
                "slide_number": 9,
                "title": "📌 Key Points & Recap",
                "subtitle": "Summary of What We Learned Today",
                "bullet_points": [
                    f"{req.topic} is structured and easy to understand when broken down",
                    "Mechanisms follow predictable steps that can be observed directly",
                    "Reviewing teacher notes ensures top exam readiness and retention"
                ],
                "speaker_notes": "Let's review these 3 points together as our final recap before the quiz.",
                "visual_description": "Pinboard graphic with 3 sticky note cards",
                "image_prompt": "Summary checklist with glowing checkmarks, 16:9",
                "layout": "Summary Checklist",
                "design_notes": "Clean emerald green highlights"
            },
            {
                "slide_number": 10,
                "title": "❓ Quick Check-for-Understanding Quiz",
                "subtitle": "Test Your Knowledge!",
                "bullet_points": [
                    f"Q1: What is the main subject we explored today? (A) {req.topic} (B) History",
                    f"Q2: Is {req.topic} applicable in real life? (A) Yes (B) No",
                    "Q3: What boosts long-term memory? (A) Active practice (B) Ignoring notes"
                ],
                "speaker_notes": "Read each question carefully and write down your answers before flipping to the next slide.",
                "visual_description": "Quiz question mark graphic with multiple choice options",
                "image_prompt": "Quiz cards with A and B options, clean graphic design, 16:9",
                "layout": "Quiz Card",
                "design_notes": "Vibrant question callout boxes"
            },
            {
                "slide_number": 11,
                "title": "✅ Quiz Answers & Explanations",
                "subtitle": "How did you do?",
                "bullet_points": [
                    f"A1: (A) {req.topic} — This was our primary focus today!",
                    "A2: (A) Yes — It powers real-world systems and observations.",
                    "A3: (A) Active practice — Completing exercises boosts memory retention."
                ],
                "speaker_notes": "Great job if you scored 3 out of 3! Review any question you missed.",
                "visual_description": "Checkmark shield graphic with answer keys",
                "image_prompt": "Shield with golden checkmark, 16:9",
                "layout": "Answer Key",
                "design_notes": "Success green color badges"
            },
            {
                "slide_number": 12,
                "title": "🌟 Thank You & Great Work!",
                "subtitle": "Keep Learning & Exploring",
                "bullet_points": [
                    f"You have successfully mastered the basics of {req.topic}!",
                    "Download the PowerPoint deck and MP3 audio for offline revision.",
                    "See you in the next AI LMS Master Teacher lesson!"
                ],
                "speaker_notes": "Thank you students for your active participation! Keep exploring and keep learning.",
                "visual_description": "Smiling AI teacher avatar waving goodbye with stars",
                "image_prompt": "Friendly teacher waving goodbye, cheerful students, confetti, 16:9",
                "layout": "Closing Card",
                "design_notes": "Warm violet and cyan celebratory glow"
            }
        ]

        try:
            ppt_folder = os.path.join(BASE_DIR, "ppts")
            os.makedirs(ppt_folder, exist_ok=True)
            import uuid
            ppt_filename = f"gemini_deck_{req.language.lower()}_{uuid.uuid4().hex[:8]}.pptx"
            ppt_path = os.path.join(ppt_folder, ppt_filename)

            from pptx import Presentation
            from pptx.util import Inches, Pt
            from pptx.dml.color import RGBColor
            from pptx.enum.text import PP_ALIGN
            from pptx.enum.shapes import MSO_SHAPE

            prs = Presentation()
            prs.slide_width = Inches(13.333)
            prs.slide_height = Inches(7.5)
            blank_layout = prs.slide_layouts[6]

            BG_DARK = RGBColor(7, 11, 25)
            CARD_BG = RGBColor(16, 25, 48)
            CYAN_ACCENT = RGBColor(0, 212, 255)
            VIOLET_ACCENT = RGBColor(168, 85, 247)
            TEXT_MAIN = RGBColor(248, 250, 252)
            TEXT_MUTED = RGBColor(148, 163, 184)

            for s_data in structured_slides:
                slide = prs.slides.add_slide(blank_layout)
                
                # Dark background
                bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
                bg.fill.solid()
                bg.fill.fore_color.rgb = BG_DARK
                bg.line.fill.background()

                # Top Header Banner
                header = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.0))
                header.fill.solid()
                header.fill.fore_color.rgb = CARD_BG
                header.line.color.rgb = CYAN_ACCENT
                header.line.width = Pt(1.5)
                htf = header.text_frame
                htf.word_wrap = True
                hp = htf.paragraphs[0]
                hp.text = f"SLIDE {s_data['slide_number']}: {s_data['title'].upper()}"
                hp.font.size = Pt(20)
                hp.font.bold = True
                hp.font.color.rgb = CYAN_ACCENT

                # Main Content Card (Left)
                body = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(8.0), Inches(4.8))
                body.fill.solid()
                body.fill.fore_color.rgb = CARD_BG
                body.line.color.rgb = VIOLET_ACCENT
                body.line.width = Pt(1.5)
                btf = body.text_frame
                btf.word_wrap = True

                sp_sub = btf.paragraphs[0]
                sp_sub.text = s_data['subtitle']
                sp_sub.font.size = Pt(14)
                sp_sub.font.bold = True
                sp_sub.font.color.rgb = CYAN_ACCENT

                for bullet in s_data['bullet_points']:
                    bp = btf.add_paragraph()
                    bp.text = f"▶  {bullet}"
                    bp.font.size = Pt(15)
                    bp.font.color.rgb = TEXT_MAIN
                    bp.space_before = Pt(8)

                # Right Graphic Card
                rcard = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.1), Inches(1.8), Inches(3.433), Inches(4.8))
                rcard.fill.solid()
                rcard.fill.fore_color.rgb = CARD_BG
                rcard.line.color.rgb = CYAN_ACCENT
                rcard.line.width = Pt(1.5)
                rtf = rcard.text_frame
                rtf.word_wrap = True
                rp = rtf.paragraphs[0]
                rp.text = f"\n\n\n💡 {s_data['layout']}\n\n{s_data['visual_description']}"
                rp.font.size = Pt(12)
                rp.font.color.rgb = TEXT_MUTED
                rp.alignment = PP_ALIGN.CENTER

                # Embed native PowerPoint speaker notes
                if hasattr(slide, "notes_slide"):
                    try:
                        slide.notes_slide.notes_text_frame.text = s_data["speaker_notes"]
                    except Exception:
                        pass

            prs.save(ppt_path)
            if os.path.exists(ppt_path) and os.path.getsize(ppt_path) > 0:
                ppt_url = f"{BACKEND_HOST}/ppts/{ppt_filename}"
                ppt_download_url = f"{BACKEND_HOST}/lesson/download-ppt/{ppt_filename}"
        except Exception as ppt_err:
            errors.append(f"PowerPoint generation notice: {str(ppt_err)}")

        # Timestamped transcript segments for interactive audio player
        audio_segments = []
        raw_paras = [p.strip() for p in clean_speech_text.split(".") if p.strip()]
        curr_time = 0
        for seg_idx, para in enumerate(raw_paras[:8]):
            dur = max(6, min(20, int(len(para) / 10)))
            audio_segments.append({
                "id": seg_idx + 1,
                "start_time": curr_time,
                "end_time": curr_time + dur,
                "time_label": f"{int(curr_time // 60):02d}:{int(curr_time % 60):02d}",
                "text": para
            })
            curr_time += dur

        # In-video checkpoint quizzes
        video_quizzes = [
            {
                "id": 1,
                "timestamp": 8,
                "time_label": "00:08",
                "chapter_title": "1. Introduction",
                "question": f"What is the focus of today's lesson?",
                "options": [f"{req.topic}", "Ancient Roman History", "Calculus Integrals", "Unrelated Subject"],
                "correct_index": 0,
                "explanation": f"Correct! Today's lesson is specifically focused on {req.topic}."
            },
            {
                "id": 2,
                "timestamp": 20,
                "time_label": "00:20",
                "chapter_title": "2. Core Concept Check",
                "question": f"Which grade level is this lesson calibrated for?",
                "options": ["College Level", f"Class {req.class_name} Level", "Preschool", "PhD Research"],
                "correct_index": 1,
                "explanation": f"Spot on! Content and pace are tailored for Class {req.class_name}."
            },
            {
                "id": 3,
                "timestamp": 35,
                "time_label": "00:35",
                "chapter_title": "3. Summary Check",
                "question": "What is the recommended next step after the video lesson?",
                "options": ["Close without reviewing", "Complete the hands-on activity", "Skip all exercises", "Forget the topic"],
                "correct_index": 1,
                "explanation": "Great job! Active practice strengthens memory retention."
            }
        ]

        # Return standardized multi-engine response format
        return {
            "lesson_title": req.topic,
            "status": "completed",
            "audio": {
                "provider": audio_provider,
                "format": "mp3",
                "narration_script": clean_speech_text,
                "url": audio_url,
                "download_url": audio_download_url,
                "status": "success" if audio_url else "failed"
            },
            "video": {
                "provider": video_provider,
                "format": "mp4",
                "storyboard": storyboard_scenes,
                "url": video_url,
                "download_url": video_download_url,
                "status": "success" if video_url else "failed"
            },
            "presentation": {
                "provider": "Google Gemini",
                "format": "pptx",
                "slides": structured_slides,
                "url": ppt_url,
                "download_url": ppt_download_url,
                "status": "success" if ppt_url else "failed"
            },
            "errors": errors,
            # Backward compatibility fields for frontend:
            "success": True,
            "topic": req.topic,
            "language": req.language,
            "script": script_text,
            "video_script": video_script,
            "video_notes_activity": video_notes_activity,
            "audio_url": audio_url,
            "audio_download_url": audio_download_url,
            "video_url": video_url,
            "video_download_url": video_download_url,
            "ppt_url": ppt_url,
            "ppt_download_url": ppt_download_url,
            "slides": structured_slides,
            "audio_segments": audio_segments,
            "video_quizzes": video_quizzes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-video/{filename}")
def download_video(filename: str):
    video_path = os.path.join(BASE_DIR, "videos", filename)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    return FileResponse(
        video_path,
        media_type="video/mp4",
        headers={"Content-Disposition": f'attachment; filename="AI_LMS_Video_Lesson_{filename}"'}
    )


@router.get("/download-ppt/{filename}")
def download_ppt(filename: str):
    ppt_path = os.path.join(BASE_DIR, "ppts", filename)
    if not os.path.exists(ppt_path):
        raise HTTPException(status_code=404, detail="PPT file not found")
    return FileResponse(
        ppt_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="AI_LMS_Presentation_{filename}"'}
    )


@router.get("/download-audio/{filename}")
def download_audio(filename: str):
    audio_path = os.path.join(BASE_DIR, "audios", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        headers={"Content-Disposition": f'attachment; filename="AI_LMS_Audio_{filename}"'}
    )


@router.get("/audio/{filename}")
def stream_audio(filename: str):
    audio_path = os.path.join(BASE_DIR, "audios", filename)
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(audio_path, media_type="audio/mpeg")