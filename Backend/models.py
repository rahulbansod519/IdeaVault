from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, DateTime, String, ForeignKey, Boolean, text
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
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("UserDB", back_populates="ideas")
    comments = relationship("CommentsDB", back_populates="idea", cascade="all, delete-orphan")

class CommentsDB(Base):
    __tablename__ = "comments"
    id = Column(String, primary_key=True, index=True)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    idea_id = Column(String, ForeignKey("ideas.id"), nullable=False)
    author = relationship("UserDB")
    idea = relationship("IdeaDB", back_populates="comments")

Base.metadata.create_all(bind=engine)

# Auto-migration to ensure new columns exist in pre-existing tables
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE ideas ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;"))
        conn.commit()
    except Exception as e:
        print("Auto-migration notice:", e)
