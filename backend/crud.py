from sqlalchemy.orm import Session
import models, schemas, auth
import datetime

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_entries(db: Session, user_id: int, book_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.JournalEntry).filter(models.JournalEntry.owner_id == user_id)
    if book_id is not None:
        query = query.filter(models.JournalEntry.book_id == book_id)
    return query.order_by(models.JournalEntry.created_at.desc()).offset(skip).limit(limit).all()

def create_user_entry(db: Session, entry: schemas.JournalEntryCreate, user_id: int):
    if entry.content_blocks:
        entry.content = "\n".join(block.text for block in entry.content_blocks)
    elif not entry.content:
        entry.content = ""
    if not entry.title:
        entry.title = suggest_title(entry.content)
    
    # We dump to dict and remove models since models.JournalEntry(**...) requires dicts
    entry_data = entry.model_dump()
    if "content_blocks" in entry_data and entry_data["content_blocks"]:
        # content_blocks might already be dicts but if not model_dump handles it
        pass
        
    db_entry = models.JournalEntry(**entry_data, owner_id=user_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_books(db: Session, user_id: int):
    return db.query(models.Book).filter(models.Book.owner_id == user_id).order_by(models.Book.created_at.desc()).all()

def get_book(db: Session, book_id: int, user_id: int):
    return db.query(models.Book).filter(models.Book.id == book_id, models.Book.owner_id == user_id).first()

def create_book(db: Session, book: schemas.BookCreate, user_id: int):
    db_book = models.Book(**book.model_dump(), owner_id=user_id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: int, book_data: schemas.BookCreate, user_id: int):
    db_book = db.query(models.Book).filter(models.Book.id == book_id, models.Book.owner_id == user_id).first()
    if db_book:
        db_book.title = book_data.title
        db_book.cover_image_url = book_data.cover_image_url
        db.commit()
        db.refresh(db_book)
    return db_book

def get_entry(db: Session, entry_id: int):
    """Retrieve a journal entry by ID."""
    return db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()

def update_journal_entry(db: Session, entry_id: int, entry_data: schemas.JournalEntryCreate):
    """Update a journal entry's content and title, recording an edit history entry."""
    # Fetch existing entry
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not db_entry:
        raise ValueError("Journal entry not found")
        
    if entry_data.content_blocks:
        entry_data.content = "\n".join(block.text for block in entry_data.content_blocks)
    elif not entry_data.content:
        entry_data.content = ""
        
    entry_dump = entry_data.model_dump()
    # Record edit (store new content as edit)
    edit = models.JournalEntryEdit(
        entry_id=entry_id,
        title=entry_data.title,
        content=entry_data.content,
        content_blocks=entry_dump.get("content_blocks")
    )
    db.add(edit)
    # Update the main entry
    db_entry.title = entry_data.title
    db_entry.content = entry_data.content
    db_entry.content_blocks = entry_dump.get("content_blocks")
    db.commit()
    db.refresh(db_entry)
    return db_entry

def suggest_title(content: str) -> str:
    """Very naive title suggestion: take first up to five words of the content and title‑case them."""
    if not content:
        return ""
    first_line = content.strip().split("\n")[0]
    words = first_line.split()
    suggested = " ".join(words[:5])
    return suggested.title()

def create_entry_edit(db: Session, entry_id: int, edit: schemas.JournalEntryEditCreate):
    db_edit = models.JournalEntryEdit(entry_id=entry_id, **edit.model_dump())
    db.add(db_edit)
    db.commit()
    db.refresh(db_edit)
    return db_edit

def get_entry_edits(db: Session, entry_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.JournalEntryEdit)
        .filter(models.JournalEntryEdit.entry_id == entry_id)
        .order_by(models.JournalEntryEdit.edited_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_entry_insight(db: Session, insight: dict, entry_id: int):
    db_insight = models.EntryInsight(**insight, entry_id=entry_id)
    db.add(db_insight)
    db.commit()
    db.refresh(db_insight)
    return db_insight

def get_narrative_summaries(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.NarrativeSummary)
        .filter(models.NarrativeSummary.user_id == user_id)
        .order_by(models.NarrativeSummary.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_narrative_summary(db: Session, summary: schemas.NarrativeSummaryCreate, user_id: int):
    db_summary = models.NarrativeSummary(**summary.model_dump(), user_id=user_id)
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary
def save_diagnostic(db: Session, entry_id: int, diagnostic_data: dict):
    """Create or update a CognitiveDiagnostic for a journal entry.
    `diagnostic_data` is a dict matching the CognitiveDiagnostic fields
    (except id and entry_id which are handled here)."""
    # Check if a diagnostic already exists for this entry
    existing = db.query(models.CognitiveDiagnostic).filter(models.CognitiveDiagnostic.entry_id == entry_id).first()
    if existing:
        for key, value in diagnostic_data.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    # Create new diagnostic
    new_diag = models.CognitiveDiagnostic(entry_id=entry_id, **diagnostic_data)
    db.add(new_diag)
    db.commit()
    db.refresh(new_diag)
    return new_diag
