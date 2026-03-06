from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.feedback import Feedback
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class FeedbackCreate(BaseModel):
    content: str
    platform: str
    correction: str # 'toxic' or 'safe'

class FeedbackResponse(FeedbackCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

@router.post("", response_model=FeedbackResponse)
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    db_feedback = Feedback(
        content=feedback.content,
        platform=feedback.platform,
        correction=feedback.correction
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("", response_model=list[FeedbackResponse])
def list_feedback(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Feedback).offset(skip).limit(limit).all()
