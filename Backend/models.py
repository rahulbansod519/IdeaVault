from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, DateTime, String, ForeignKey
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship

try:
    from .database import Base, engine
except ImportError:
    from database import Base, engine


class UserDB(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    ideas = relationship("IdeaDB", back_populates="owner")
    
class IdeaDB(Base):
    __tablename__ = "ideas"
    id = Column(String, primary_key=True, index=True)
    raw_notes = Column(String, nullable=False)
    title = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("UserDB", back_populates="ideas")

Base.metadata.create_all(bind=engine)
