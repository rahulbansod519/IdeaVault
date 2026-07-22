from datetime import timedelta
from warnings import deprecated
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Depends
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

try:
    from .database import get_db
    from .models import IdeaDB, UserDB, CommentsDB
    from .schemas import IdeaCreate, IdeaUpdate, Idea, UserCreate, Token, CommentCreate, CommentResponse
except ImportError:
    from database import get_db
    from models import IdeaDB, UserDB, CommentsDB
    from schemas import IdeaCreate, IdeaUpdate, Idea, UserCreate, Token, CommentCreate, CommentResponse
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
import bcrypt
# pyrefly: ignore [missing-import]
import jwt
# pyrefly: ignore [missing-import]
from jwt.exceptions import PyJWTError
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

if not SECRET_KEY:
    raise ValueError("No JWT Secret Key Found")

oauth2_schema = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(title="Idea Vault App")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

if "*" in origins or not origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_schema), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

    

@app.post("/ideas", response_model=Idea)
def create_idea(idea_in: IdeaCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    idea_id = str(uuid.uuid4())
    now = datetime.now()

    new_idea = IdeaDB(
        id = idea_id,
        raw_notes = idea_in.raw_notes,
        title = idea_in.title,
        status = "noted",
        created_at = now,
        updated_at = now,
        user_id = current_user.id,
        is_public = idea_in.is_public
    )

    db.add(new_idea)
    db.commit()
    db.refresh(new_idea)
    return new_idea


@app.get("/ideas", response_model=list[Idea])
def get_all_ideas(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    return db.query(IdeaDB).filter(IdeaDB.user_id == current_user.id).all()


@app.patch("/ideas/{idea_id}", response_model=Idea)
def update_idea(idea_id: str, idea_update: IdeaUpdate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    existing_idea = db.query(IdeaDB).filter(IdeaDB.id == idea_id, IdeaDB.user_id == current_user.id).first()
    if not existing_idea:
        raise HTTPException(status_code=404, detail="Idea Not Found")
    update_data = idea_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_idea, key, value)
    
    existing_idea.updated_at = datetime.now()
    db.commit()
    db.refresh(existing_idea)
    return existing_idea


@app.delete("/ideas/{idea_id}")
def delete_idea(idea_id: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    existing_idea = db.query(IdeaDB).filter(IdeaDB.id == idea_id, IdeaDB.user_id == current_user.id).first()
    if not existing_idea:
        raise HTTPException(status_code=404, detail="Idea Not Found")
    
    db.query(CommentsDB).filter(CommentsDB.idea_id == idea_id).delete()
    db.delete(existing_idea)
    db.commit()
    return {"message": "Idea Deleted"}


@app.post("/register", response_model=dict)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_user = db.query(UserDB).filter(UserDB.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password and create the user
    user_id = str(uuid.uuid4())
    hashed_pwd = get_password_hash(user_in.password)
    
    new_user = UserDB(
        id=user_id,
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    return {"message": "User successfully created. You can now log in."}

@app.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Find the user by email (FastAPI's OAuth2 form uses 'username' for the email field)
    user = db.query(UserDB).filter(UserDB.email == form_data.username).first()
    
    # 2. Verify existence and password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # 3. Generate the VIP wristband (JWT) containing the user's ID
    access_token = create_access_token(data={"sub": user.id})
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/ideas/public", response_model=list[Idea])
def get_public_ideas(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    return db.query(IdeaDB).filter(IdeaDB.is_public == True).all()


@app.post("/ideas/{idea_id}/comments", response_model=CommentResponse)
def add_comment(idea_id: str, comment_in: CommentCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    idea = db.query(IdeaDB).filter(IdeaDB.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea Not Found")
    if not idea.is_public and idea.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can not comment on private posts")

    new_comment = CommentsDB(
        id = str(uuid.uuid4()),
        content = comment_in.content,
        user_id = current_user.id,
        idea_id=idea_id
        
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@app.get("/ideas/{idea_id}/comments", response_model=list[CommentResponse])
def get_all_comments(idea_id: str, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    idea = db.query(IdeaDB).filter(IdeaDB.id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea Not Found")
    if not idea.is_public and idea.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can not view comments on private posts")

    return db.query(CommentsDB).filter(CommentsDB.idea_id == idea_id).all()