# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IdeaCreate(BaseModel):
    raw_notes: str
    title: Optional[str] = None
    is_public: bool = False

class IdeaUpdate(BaseModel):
    raw_notes: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None

class Idea(BaseModel):
    id: str
    raw_notes: str
    title: Optional[str] = None
    status: str
    is_public: bool = False
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class CommentCreate(BaseModel):
    content: str
    
class CommentResponse(BaseModel):
    id: str
    content: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

