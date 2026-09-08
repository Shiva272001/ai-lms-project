from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, QuizResult


router = APIRouter(
    prefix="/analytics",
    tags=["Progress Analytics"]
)


# =========================================================
# GET STUDENT PROGRESS
# =========================================================

# GET STUDENT PROGRESS BY NAME OR ROLL NO
# =========================================================

@router.get("/progress/{student_query}")
def get_progress(
    student_query: str,
    db: Session = Depends(get_db)
):
    query_str = student_query.strip()
    
    rows = []
    try:
        filter_cond = (QuizResult.student_name.ilike(f"%{query_str}%")) | (QuizResult.roll_no == query_str)
        if query_str.isdigit():
            filter_cond = filter_cond | (QuizResult.student_id == int(query_str))

        rows = (
            db.query(
                QuizResult.topic,
                func.avg(QuizResult.score).label("avg_score"),
                func.count(QuizResult.id).label("quiz_count"),
                func.max(QuizResult.score).label("highest_score"),
                func.max(QuizResult.student_name).label("student_name"),
                func.max(QuizResult.roll_no).label("roll_no")
            )
            .filter(filter_cond)
            .group_by(QuizResult.topic)
            .all()
        )
    except Exception as query_err:
        print("Extended query fallback:", query_err)
        db.rollback()
        # Fallback to student_id matching only if columns don't exist yet on remote table
        filter_id = int(query_str) if query_str.isdigit() else 1
        rows = (
            db.query(
                QuizResult.topic,
                func.avg(QuizResult.score).label("avg_score"),
                func.count(QuizResult.id).label("quiz_count"),
                func.max(QuizResult.score).label("highest_score")
            )
            .filter(QuizResult.student_id == filter_id)
            .group_by(QuizResult.topic)
            .all()
        )

    progress = []
    student_name_found = query_str
    roll_no_found = query_str

    for row in rows:
        if hasattr(row, "student_name") and row.student_name:
            student_name_found = row.student_name
        if hasattr(row, "roll_no") and row.roll_no:
            roll_no_found = row.roll_no
        progress.append({
            "topic": row.topic,
            "avg_score": round(float(row.avg_score or 0), 2),
            "quiz_count": int(row.quiz_count or 0),
            "highest_score": round(float(row.highest_score or 0), 2),
            "pass_count": int(row.quiz_count or 0) if round(float(row.avg_score or 0), 2) >= 4.0 else 0,
            "fail_count": 0 if round(float(row.avg_score or 0), 2) >= 4.0 else int(row.quiz_count or 0)
        })

    try:
        filter_cond = (QuizResult.student_name.ilike(f"%{query_str}%")) | (QuizResult.roll_no == query_str)
        if query_str.isdigit():
            filter_cond = filter_cond | (QuizResult.student_id == int(query_str))
        total_quizzes = db.query(func.count(QuizResult.id)).filter(filter_cond).scalar()
        overall_average = db.query(func.avg(QuizResult.score)).filter(filter_cond).scalar()
        highest_score = db.query(func.max(QuizResult.score)).filter(filter_cond).scalar()
    except Exception:
        db.rollback()
        filter_id = int(query_str) if query_str.isdigit() else 1
        total_quizzes = db.query(func.count(QuizResult.id)).filter(QuizResult.student_id == filter_id).scalar()
        overall_average = db.query(func.avg(QuizResult.score)).filter(QuizResult.student_id == filter_id).scalar()
        highest_score = db.query(func.max(QuizResult.score)).filter(QuizResult.student_id == filter_id).scalar()

    return {
        "student_query": student_query,
        "student_name": student_name_found,
        "roll_no": roll_no_found,
        "summary": {
            "total_quizzes": int(total_quizzes or 0),
            "average_score": round(float(overall_average or 0), 2),
            "highest_score": round(float(highest_score or 0), 2)
        },
        "progress": progress,
        "data": progress
    }


# =========================================================
# SAVE QUIZ SCORE
# =========================================================

@router.post("/save-score")
def save_score(
    student_id: int = 1,
    student_name: str = "Student",
    roll_no: str = "1",
    topic: str = "General Quiz",
    score: float = 0.0,
    db: Session = Depends(get_db)
):
    if not topic or not topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    if score < 0 or score > 10:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 10.")

    row = QuizResult(
        student_id=student_id,
        student_name=student_name.strip() if student_name else "Student",
        roll_no=roll_no.strip() if roll_no else str(student_id),
        topic=topic.strip(),
        score=round(score, 2)
    )

    try:
        db.add(row)
        db.commit()
        db.refresh(row)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not save quiz score: {str(e)}")

    return {
        "message": "Score saved successfully",
        "result": {
            "id": row.id,
            "student_id": row.student_id,
            "student_name": row.student_name,
            "roll_no": row.roll_no,
            "topic": row.topic,
            "score": row.score
        }
    }