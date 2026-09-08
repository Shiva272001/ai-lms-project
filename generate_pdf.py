import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_quiz_pdf(filename="quiz_questions.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=15
    )
    
    question_style = ParagraphStyle(
        'QuestionStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6
    )
    
    answer_style = ParagraphStyle(
        'AnswerStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=14
    )

    quiz_data = [
        {
            "num": 11,
            "q": "Computers are electronic devices classified by purpose, by type, and by size and speed, ranging from Microcomputers to <u>Supercomputers</u>.",
            "ans": "Supercomputers"
        },
        {
            "num": 12,
            "q": "AI models learn from training data, which means unfair inputs can lead to data bias, measurement bias, <u>algorithmic bias</u>, and historical bias.",
            "ans": "Algorithmic bias"
        },
        {
            "num": 13,
            "q": "Using technology to threaten or shame someone is <u>cyberbullying</u>.",
            "ans": "Cyberbullying"
        },
        {
            "num": 14,
            "q": "Following moral guidelines helps prevent unethical activities like digital plagiarism, phishing, hacking, and <u>software piracy</u>.",
            "ans": "Software piracy"
        },
        {
            "num": 15,
            "q": "A drone flies by balancing upward lift, downward gravity, forward thrust, and backward <u>drag</u>.",
            "ans": "Drag"
        },
        {
            "num": 16,
            "q": "Drones maintain stability because the rotational forces of their clockwise and anti-clockwise propellers <u>cancel each other out</u>.",
            "ans": "Cancel each other out"
        }
    ]

    story = []
    
    story.append(Paragraph("Quiz Questions & Answers", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0284c7"), spaceAfter=15))
    
    for item in quiz_data:
        q_text = f"<b>{item['num']}.</b> {item['q']}"
        story.append(Paragraph(q_text, question_style))
        ans_text = f"<b>Answer:</b> {item['ans']}"
        story.append(Paragraph(ans_text, answer_style))
        story.append(Spacer(1, 4))

    doc.build(story)
    print(f"PDF successfully generated: {os.path.abspath(filename)}")

if __name__ == "__main__":
    generate_quiz_pdf()
