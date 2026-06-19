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

def get_entries(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.JournalEntry)
        .filter(models.JournalEntry.owner_id == user_id)
        .order_by(models.JournalEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_entry(db: Session, entry_id: int):
    """Retrieve a journal entry by ID."""
    return db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()

def update_journal_entry(db: Session, entry_id: int, entry_data: schemas.JournalEntryCreate):
    """Update a journal entry's content and title, recording an edit history entry."""
    # Fetch existing entry
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not db_entry:
        raise ValueError("Journal entry not found")
    # Record edit (store new content as edit)
    edit = models.JournalEntryEdit(
        entry_id=entry_id,
        title=entry_data.title,
        content=entry_data.content,
    )
    db.add(edit)
    # Update the main entry
    db_entry.title = entry_data.title
    db_entry.content = entry_data.content
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
