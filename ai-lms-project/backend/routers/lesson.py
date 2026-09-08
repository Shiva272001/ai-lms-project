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
                "http://127.0.0.1:8000"
                + lesson.image_url
            )
            if lesson.image_url
            else None,

            "lesson": lesson.content,

            "pdf_file": lesson.pdf_file,

            "pdf_url": pdf_url,

            "pdf_download_url": (
                "http://127.0.0.1:8000"
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
            audio_url = f"http://127.0.0.1:8000/lesson/audio/{audio_filename}"
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

        # Synthesize audio mp3 file using ElevenLabs (with gTTS fallback)
        audio_url = None
        audio_download_url = None
        audio_path = None
        try:
            audio_folder = os.path.join(BASE_DIR, "audios")
            os.makedirs(audio_folder, exist_ok=True)
            import uuid
            audio_filename = f"studio_{req.language.lower()}_{uuid.uuid4().hex[:8]}.mp3"
            audio_path = os.path.join(audio_folder, audio_filename)

            clean_text = re.sub(r'[*#_~`\[\]]', '', script_text[:2500])
            
            # Check ElevenLabs API Key
            eleven_key = os.getenv("ELEVENLABS_API_KEY")
            eleven_success = False
            if eleven_key:
                try:
                    import requests
                    # Use Rachel / Female teacher voice ID: 21m00Tcm4TlvDq8ikWAM
                    voice_id = "21m00Tcm4TlvDq8ikWAM"
                    el_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                    headers = {
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": eleven_key
                    }
                    payload = {
                        "text": clean_text[:1500],
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75
                        }
                    }
                    el_res = requests.post(el_url, json=payload, headers=headers, timeout=15)
                    if el_res.status_code == 200 and el_res.content:
                        with open(audio_path, "wb") as f_aud:
                            f_aud.write(el_res.content)
                        eleven_success = True
                except Exception as el_err:
                    print("ElevenLabs TTS notice:", el_err)

            if not eleven_success:
                from gtts import gTTS
                tts = gTTS(text=clean_text, lang=gtts_lang, slow=False)
                tts.save(audio_path)

            audio_url = f"http://127.0.0.1:8000/lesson/audio/{audio_filename}"
            audio_download_url = f"http://127.0.0.1:8000/lesson/download-audio/{audio_filename}"
        except Exception as tts_err:
            print("Studio TTS warning:", tts_err)

        # Hugging Face Inference API Text-to-Video Generation Pipeline
        video_url = None
        video_download_url = None
        
        hf_key = os.getenv("HUGGINGFACE_API_KEY")
        if hf_key:
            try:
                video_folder = os.path.join(BASE_DIR, "videos")
                os.makedirs(video_folder, exist_ok=True)
                import uuid
                video_filename = f"hf_video_{req.language.lower()}_{uuid.uuid4().hex[:8]}.mp4"
                video_path = os.path.join(video_folder, video_filename)

                import requests
                clean_content_snippet = re.sub(r'[*#_~`\[\]]', '', script_text[:250]).strip()
                hf_prompt = f"3D animated educational video lesson explaining '{req.topic}': {clean_content_snippet}, vibrant 3D cartoon style, high definition, detailed"
                
                # Hugging Face Text-to-Video model endpoints
                hf_models = [
                    "https://api-inference.huggingface.co/models/damo-vilab/text-to-video-ms-1.7m",
                    "https://api-inference.huggingface.co/models/ali-vilab/text-to-video-ms-1.7m",
                    "https://api-inference.huggingface.co/models/ZeroScope/zeroscope_v2_576w",
                    "https://api-inference.huggingface.co/models/ByteDance/AnimateDiff"
                ]
                
                for hf_url in hf_models:
                    try:
                        hf_res = requests.post(hf_url, headers=hf_headers, json={"inputs": hf_prompt}, timeout=35)
                        if hf_res.status_code == 200 and len(hf_res.content) > 5000:
                            raw_vid_path = os.path.join(video_folder, f"raw_{video_filename}")
                            with open(raw_vid_path, "wb") as f_raw:
                                f_raw.write(hf_res.content)

                            # Attach audio voiceover to Hugging Face video if available
                            if audio_path and os.path.exists(audio_path):
                                try:
                                    try:
                                        from moviepy.video.io.VideoFileClip import VideoFileClip
                                        from moviepy.audio.io.AudioFileClip import AudioFileClip
                                    except ImportError:
                                        from moviepy.editor import VideoFileClip, AudioFileClip

                                    v_clip = VideoFileClip(raw_vid_path)
                                    a_clip = AudioFileClip(audio_path)
                                    final_clip = v_clip.set_audio(a_clip)
                                    final_clip = final_clip.set_duration(a_clip.duration)
                                    final_clip.write_videofile(video_path, fps=12, codec="libx264", audio_codec="aac", preset="ultrafast")
                                except Exception as sync_err:
                                    print("MoviePy audio overlay notice:", sync_err)
                                    with open(video_path, "wb") as f_out:
                                        f_out.write(hf_res.content)
                            else:
                                with open(video_path, "wb") as f_out:
                                    f_out.write(hf_res.content)

                            video_url = f"http://127.0.0.1:8000/videos/{video_filename}"
                            video_download_url = f"http://127.0.0.1:8000/lesson/download-video/{video_filename}"
                            break
                    except Exception as m_err:
                        print(f"HF model attempt notice ({hf_url}):", m_err)
            except Exception as hf_err:
                print("HuggingFace video generation notice:", hf_err)

        # Fallback MP4 Video rendering if Hugging Face model is warming up
        if not video_url:
            try:
                video_folder = os.path.join(BASE_DIR, "videos")
                os.makedirs(video_folder, exist_ok=True)
                import uuid
                video_filename = f"slide_video_{req.language.lower()}_{uuid.uuid4().hex[:8]}.mp4"
                video_path = os.path.join(video_folder, video_filename)

                from PIL import Image, ImageDraw, ImageFont
                try:
                    from moviepy.video.io.ImageSequenceClip import ImageSequenceClip
                    from moviepy.audio.io.AudioFileClip import AudioFileClip
                except ImportError:
                    from moviepy.editor import ImageSequenceClip, AudioFileClip

                slides_dir = os.path.join(BASE_DIR, "scratch_slides")
                os.makedirs(slides_dir, exist_ok=True)

                paragraphs = [p.strip() for p in str(script_text).split("\n") if p.strip() and not p.startswith("#")][:4]
                if not paragraphs:
                    paragraphs = [script_text[:150]]

                slide_paths = []
                width, height = 1280, 720
                for idx, para in enumerate(paragraphs):
                    img = Image.new("RGB", (width, height), color=(7, 12, 26))
                    draw = ImageDraw.Draw(img)
                    draw.rectangle([20, 20, width - 20, height - 20], outline=(0, 212, 255), width=4)
                    draw.rectangle([40, 40, width - 40, 100], fill=(0, 212, 255))
                    draw.text((60, 60), f"AI LMS {req.language.upper()} VIDEO • SLIDE {idx+1}: {req.topic.upper()}", fill=(5, 7, 15))

                    clean_p = re.sub(r'[*#_~`\[\]]', '', para)
                    words = clean_p.split()
                    lines = []
                    curr = ""
                    for w in words:
                        if len(curr) + len(w) + 1 <= 40:
                            curr = f"{curr} {w}".strip()
                        else:
                            if curr: lines.append(curr)
                            curr = w
                    if curr: lines.append(curr)

                    y_off = 160
                    for line in lines[:8]:
                        draw.text((60, y_off), line, fill=(248, 250, 252))
                        y_off += 40

                    sp = os.path.join(slides_dir, f"slide_{idx}_{uuid.uuid4().hex[:4]}.png")
                    img.save(sp)
                    slide_paths.append(sp)

                clip = ImageSequenceClip(slide_paths, fps=0.5)
                if audio_path and os.path.exists(audio_path):
                    try:
                        aud_clip = AudioFileClip(audio_path)
                        clip = clip.set_duration(aud_clip.duration)
                        clip = clip.set_audio(aud_clip)
                    except Exception:
                        pass

                clip.write_videofile(video_path, fps=5, codec="libx264", audio_codec="aac", preset="ultrafast")
                video_url = f"http://127.0.0.1:8000/videos/{video_filename}"
                video_download_url = f"http://127.0.0.1:8000/lesson/download-video/{video_filename}"
            except Exception as fallback_err:
                print("Fallback MP4 render notice:", fallback_err)

        # Generate Gamma-App Styled Modern Presentation (.pptx)
        ppt_url = None
        ppt_download_url = None
        try:
            ppt_folder = os.path.join(BASE_DIR, "ppts")
            os.makedirs(ppt_folder, exist_ok=True)
            import uuid
            ppt_filename = f"gamma_deck_{req.language.lower()}_{uuid.uuid4().hex[:8]}.pptx"
            ppt_path = os.path.join(ppt_folder, ppt_filename)

            from pptx import Presentation
            from pptx.util import Inches, Pt
            from pptx.dml.color import RGBColor
            from pptx.enum.text import PP_ALIGN
            from pptx.enum.shapes import MSO_SHAPE

            prs = Presentation()
            # Set 16:9 Widescreen dimensions (13.333 x 7.5 inches)
            prs.slide_width = Inches(13.333)
            prs.slide_height = Inches(7.5)

            blank_layout = prs.slide_layouts[6]

            # Gamma Design Color Palette (Dark Theme)
            BG_DARK = RGBColor(10, 15, 29)
            CARD_BG = RGBColor(16, 25, 48)
            CYAN_ACCENT = RGBColor(0, 212, 255)
            VIOLET_ACCENT = RGBColor(168, 85, 247)
            TEXT_MAIN = RGBColor(248, 250, 252)
            TEXT_MUTED = RGBColor(148, 163, 184)

            # Slide 1: Cover Title Slide (Gamma Style Hero Card)
            slide1 = prs.slides.add_slide(blank_layout)
            bg_rect = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
            bg_rect.fill.solid()
            bg_rect.fill.fore_color.rgb = BG_DARK
            bg_rect.line.fill.background()

            # Main Card Box
            card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(1.5), Inches(10.333), Inches(4.5))
            card.fill.solid()
            card.fill.fore_color.rgb = CARD_BG
            card.line.color.rgb = CYAN_ACCENT
            card.line.width = Pt(2)

            tf1 = card.text_frame
            tf1.word_wrap = True
            p1 = tf1.paragraphs[0]
            p1.text = f"✨ {req.topic.upper()}"
            p1.font.size = Pt(36)
            p1.font.bold = True
            p1.font.color.rgb = CYAN_ACCENT
            p1.alignment = PP_ALIGN.CENTER

            p2 = tf1.add_paragraph()
            p2.text = f"\nAI Interactive Presentation • Class {req.class_name} ({req.language})"
            p2.font.size = Pt(20)
            p2.font.color.rgb = TEXT_MAIN
            p2.alignment = PP_ALIGN.CENTER

            # Content Slides (Gamma Modern Cards Layout built from Video Visual Scene Storyboard)
            storyboard_source = video_script or script_text
            scenes = [s.strip() for s in str(storyboard_source).split("\n\n") if s.strip() and not s.startswith("#")][:6]
            if not scenes:
                scenes = [p.strip() for p in str(storyboard_source).split("\n") if p.strip() and not p.startswith("#")][:6]

            for idx, scene_text in enumerate(scenes):
                s = prs.slides.add_slide(blank_layout)
                bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
                bg.fill.solid()
                bg.fill.fore_color.rgb = BG_DARK
                bg.line.fill.background()

                # Header Top Pill
                header = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.6), Inches(11.733), Inches(0.9))
                header.fill.solid()
                header.fill.fore_color.rgb = CARD_BG
                header.line.color.rgb = CYAN_ACCENT
                header.line.width = Pt(1.5)
                htf = header.text_frame
                hp = htf.paragraphs[0]
                hp.text = f"🎬 SCENE {idx+1} STORYBOARD • {req.topic.upper()}"
                hp.font.size = Pt(18)
                hp.font.bold = True
                hp.font.color.rgb = CYAN_ACCENT

                # Load Female Teacher Avatar and AI Diagram Illustration for PPT slides
                teacher_avatar_path = os.path.join(BASE_DIR, "images", "teacher_avatar.jpg")
                
                # Split slide layout: Content Card Box (Left) + AI Teacher Illustration (Right)
                body_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(7.5), Inches(4.8))
                body_card.fill.solid()
                body_card.fill.fore_color.rgb = CARD_BG
                body_card.line.color.rgb = VIOLET_ACCENT
                body_card.line.width = Pt(1.5)
                btf = body_card.text_frame
                btf.word_wrap = True

                bp = btf.paragraphs[0]
                clean_scene = re.sub(r'[*#_~`\[\]]', '', scene_text)
                bp.text = clean_scene[:420]
                bp.font.size = Pt(18)
                bp.font.color.rgb = TEXT_MAIN

                # Educational Graphic Card (Right Side)
                img_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.6), Inches(1.8), Inches(3.9), Inches(4.8))
                img_card.fill.solid()
                img_card.fill.fore_color.rgb = CARD_BG
                img_card.line.color.rgb = CYAN_ACCENT
                img_card.line.width = Pt(1.5)

                if os.path.exists(teacher_avatar_path):
                    try:
                        s.shapes.add_picture(teacher_avatar_path, Inches(8.8), Inches(2.0), width=Inches(3.5), height=Inches(3.5))
                    except Exception as p_err:
                        print("PPT picture embed notice:", p_err)

                itf = img_card.text_frame
                itf.word_wrap = True
                ip = itf.paragraphs[0]
                ip.text = f"\n\n\n\n\n\n\n\n👩‍🏫 MASTER TEACHER • CLASS {req.class_name}"
                ip.font.size = Pt(13)
                ip.font.bold = True
                ip.font.color.rgb = CYAN_ACCENT
                ip.alignment = PP_ALIGN.CENTER

            prs.save(ppt_path)
            ppt_url = f"http://127.0.0.1:8000/ppts/{ppt_filename}"
            ppt_download_url = f"http://127.0.0.1:8000/lesson/download-ppt/{ppt_filename}"
        except Exception as ppt_err:
            print("Gamma PPT presentation notice:", ppt_err)

        return {
            "success": True,
            "topic": req.topic,
            "language": req.language,
            "media_type": req.media_type,
            "script": script_text,
            "video_script": video_script,
            "video_notes_activity": video_notes_activity,
            "audio_url": audio_url,
            "audio_download_url": audio_download_url,
            "video_url": video_url,
            "video_download_url": video_download_url,
            "ppt_url": ppt_url,
            "ppt_download_url": ppt_download_url
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