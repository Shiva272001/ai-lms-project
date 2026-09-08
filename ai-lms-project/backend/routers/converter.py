from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import io
import re
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from fastapi.responses import FileResponse

from llm import get_llm

router = APIRouter(
    prefix="/converter",
    tags=["AI Homework & PDF Converter"]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONVERTED_PDF_FOLDER = os.path.join(BASE_DIR, "converted_pdfs")
os.makedirs(CONVERTED_PDF_FOLDER, exist_ok=True)


class ConvertTextRequest(BaseModel):
    raw_text: str
    target_class: int = 5
    topic: str = "Homework Notes"


@router.post("/convert-homework")
async def convert_homework(file: UploadFile = File(...)):
    filename = file.filename or "homework_notes"
    contents = await file.read()
    lower_name = filename.lower()
    
    extracted_text = ""

    if lower_name.endswith((".png", ".jpg", ".jpeg", ".webp")):
        try:
            llm = get_llm(provider="gemini")
            b64_img = base64.b64encode(contents).decode("utf-8")
            media_type = file.content_type or "image/png"
            
            prompt = [
                {
                    "type": "text",
                    "text": "You are an expert OCR transcription assistant. Transcribe and extract all handwritten or printed text from this homework document accurately. Fix obvious spelling mistakes, organize into neat paragraphs, and output ONLY the clean transcribed text."
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{media_type};base64,{b64_img}"}
                }
            ]
            res = llm.invoke(prompt)
            extracted_text = res.content if hasattr(res, "content") else str(res)
        except Exception as e:
            print("Vision OCR error:", e)
            extracted_text = "Failed to extract text from image."

    elif lower_name.endswith(".pdf"):
        try:
            pages_text = []
            try:
                import fitz
                doc = fitz.open(stream=contents, filetype="pdf")
                for page in doc:
                    t = page.get_text()
                    if t and len(t.strip()) > 20:
                        pages_text.append(t.strip())
                    else:
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        b64_img = base64.b64encode(img_bytes).decode("utf-8")
                        llm = get_llm(provider="gemini")
                        prompt = [
                            {"type": "text", "text": "Transcribe all text from this page completely."},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}}
                        ]
                        res = llm.invoke(prompt)
                        raw_c = res.content if hasattr(res, "content") else str(res)
                        if isinstance(raw_c, list):
                            raw_c = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in raw_c])
                        pages_text.append(str(raw_c))
                doc.close()
            except Exception:
                import io
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(contents))
                for page in reader.pages:
                    pt = page.extract_text()
                    if pt:
                        pages_text.append(pt.strip())

            extracted_text = "\n\n".join(pages_text) if pages_text else "No text extracted from PDF."
        except Exception as pdf_err:
            extracted_text = f"PDF Parsing Error: {pdf_err}"

    else:
        extracted_text = contents.decode("utf-8", errors="ignore")

    # Format into Structured Digital Lesson using LLM
    try:
        llm = get_llm(temperature=0.3)
        formatting_prompt = f"""You are an educational AI assistant.
Transform the following raw/handwritten homework text into a beautifully structured digital lesson note:

RAW HOMEWORK TEXT:
{extracted_text[:4000]}

Provide output with:
1. Lesson Title
2. Key Concepts & Definitions
3. Clean Structured Explanations
4. Summary & Takeaways
"""
        formatted_res = llm.invoke(formatting_prompt)
        structured_text = formatted_res.content if hasattr(formatted_res, "content") else str(formatted_res)
        if isinstance(structured_text, list):
            structured_text = "".join([b.get("text", str(b)) if isinstance(b, dict) else str(b) for b in structured_text])
        structured_text = str(structured_text)
    except Exception:
        structured_text = str(extracted_text)

    # Generate Downloadable PDF
    pdf_filename = f"digital_lesson_{os.urandom(4).hex()}.pdf"
    pdf_path = os.path.join(CONVERTED_PDF_FOLDER, pdf_filename)
    
    try:
        doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        story = []
        
        title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=18, leading=22, textColor="#0284c7")
        body_style = ParagraphStyle('DocBody', parent=styles['Normal'], fontSize=11, leading=15, textColor="#1e293b")
        
        story.append(Paragraph("💎 AI LMS - Converted Digital Homework Lesson", title_style))
        story.append(Spacer(1, 12))
        
        for para in str(structured_text).split("\n"):
            if para.strip():
                clean_p = re.sub(r'[*#_~`]', '', para.strip())
                story.append(Paragraph(clean_p, body_style))
                story.append(Spacer(1, 6))
                
        doc.build(story)
        pdf_download_url = f"http://127.0.0.1:8000/converter/download-pdf/{pdf_filename}"
    except Exception as pdf_gen_err:
        print("PDF Gen error:", pdf_gen_err)
        pdf_download_url = None

    return {
        "success": True,
        "filename": filename,
        "extracted_raw_text": extracted_text,
        "digital_structured_lesson": structured_text,
        "pdf_download_url": pdf_download_url
    }


@router.get("/download-pdf/{filename}")
def download_converted_pdf(filename: str):
    pdf_path = os.path.join(CONVERTED_PDF_FOLDER, filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Converted PDF file not found.")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Digital_Homework_Lesson_{filename}")
