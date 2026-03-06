from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, index=True)
    platform = Column(String)
    correction = Column(String) # 'toxic' (false negative) or 'safe' (false positive)
    timestamp = Column(DateTime, default=datetime.utcnow)
