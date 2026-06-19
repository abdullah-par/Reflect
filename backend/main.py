from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware

import crud, models, schemas, auth
from database import SessionLocal, engine
from typing import List, Optional

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Antigravity API", description="Autonomous Cognitive Journaling & Personal Intelligence Engine")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username) # OAuth2 uses 'username' field
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user

@app.post("/entries/", response_model=schemas.JournalEntry)
def create_entry(
    entry: schemas.JournalEntryCreate, 
    db: Session = Depends(get_db), 
    current_user: schemas.User = Depends(get_current_user)
):
    db_entry = crud.create_user_entry(db=db, entry=entry, user_id=current_user.id)
    
    import intelligence
    try:
        insight_data, retrieved_docs = intelligence.process_entry(db_entry.content, current_user.id)
        past_entries_serialized = []
        for doc in retrieved_docs:
            past_entries_serialized.append({
                "content": doc.page_content,
                "metadata": doc.metadata if hasattr(doc, "metadata") else {}
            })
            
        insight_dict = {
            "pattern_name": insight_data.get("pattern_name"),
            "emotional_tone": insight_data.get("emotional_tone"),
            "relationships_tracked": insight_data.get("relationships_tracked"),
            "takeaway": insight_data.get("takeaway"),
            "relevant_past_entries": past_entries_serialized
        }
        crud.create_entry_insight(db=db, insight=insight_dict, entry_id=db_entry.id)
    except Exception as e:
        print("Intelligence engine failed:", e)
        fallback_insight = {
            "pattern_name": "Analysis Pending",
            "emotional_tone": "Unknown",
            "relationships_tracked": {},
            "takeaway": "Insights will appear once processing completes.",
            "relevant_past_entries": []
        }
        crud.create_entry_insight(db=db, insight=fallback_insight, entry_id=db_entry.id)
        
    db.refresh(db_entry)
    return db_entry

@app.get("/entries/", response_model=list[schemas.JournalEntry])
def read_entries(
    book_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    entries = crud.get_entries(db, user_id=current_user.id, book_id=book_id, skip=skip, limit=limit)
    return entries

# ----- Book Endpoints -----

@app.get("/books/", response_model=List[schemas.Book])
def read_books(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return crud.get_books(db, user_id=current_user.id)

@app.post("/books/", response_model=schemas.Book)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    return crud.create_book(db, book=book, user_id=current_user.id)

@app.put("/books/{book_id}", response_model=schemas.Book)
def update_book(book_id: int, book: schemas.BookCreate, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    db_book = crud.update_book(db, book_id=book_id, book_data=book, user_id=current_user.id)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

@app.get("/books/{book_id}", response_model=schemas.Book)
def read_book(book_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    db_book = crud.get_book(db, book_id=book_id, user_id=current_user.id)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    return db_book

# ----- New Endpoints -----

@app.get("/entries/{entry_id}/edits", response_model=List[schemas.JournalEntryEdit])
def read_entry_edits(entry_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id, models.JournalEntry.owner_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return crud.get_entry_edits(db, entry_id=entry_id)

@app.post("/entries/{entry_id}/suggest-title", response_model=dict)
def suggest_entry_title(entry_id: int, db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    entry = crud.get_entry(db, entry_id=entry_id)
    if not entry or entry.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    suggestion = crud.suggest_title(entry.content)
    return {"suggested_title": suggestion}
@app.post("/entries/{entry_id}/diagnose", response_model=schemas.CognitiveDiagnostic)

def diagnose_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    entry = crud.get_entry(db, entry_id)
    if not entry or entry.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    result = intelligence.run_diagnostic(entry.content, current_user.id)
    return crud.save_diagnostic(db=db, entry_id=entry_id, diagnostic_data=result)

@app.get("/entries/{entry_id}/diagnose", response_model=schemas.CognitiveDiagnostic)

def get_diagnostic(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    entry = crud.get_entry(db, entry_id)
    if not entry or entry.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Entry not found")
    diagnostic = db.query(models.CognitiveDiagnostic).filter(models.CognitiveDiagnostic.entry_id == entry_id).first()
    if not diagnostic:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return diagnostic

@app.post("/summaries/generate", response_model=schemas.NarrativeSummary)
def generate_summary(
    summary_data: dict,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    from datetime import datetime
    try:
        p_start = datetime.fromisoformat(summary_data["period_start"])
        p_end = datetime.fromisoformat(summary_data["period_end"])
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
        
    entries = db.query(models.JournalEntry).filter(
        models.JournalEntry.owner_id == current_user.id,
        models.JournalEntry.created_at >= p_start,
        models.JournalEntry.created_at <= p_end
    ).all()
    
    if not entries:
        raise HTTPException(status_code=400, detail="No entries found in this period to summarize.")
        
    import intelligence
    content = intelligence.generate_narrative_summary(entries)
    
    summary_create = schemas.NarrativeSummaryCreate(
        period_start=p_start,
        period_end=p_end,
        summary_type=summary_data.get("summary_type", "weekly"),
        content=content
    )
    return crud.create_narrative_summary(db=db, summary=summary_create, user_id=current_user.id)

@app.get("/summaries/", response_model=list[schemas.NarrativeSummary])
def read_summaries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_narrative_summaries(db=db, user_id=current_user.id, skip=skip, limit=limit)

@app.get("/")
def read_root():
    return {"message": "Welcome to Antigravity API"}
