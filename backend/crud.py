from sqlalchemy.orm import Session
import models, schemas, auth

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
    return db.query(models.JournalEntry).filter(models.JournalEntry.owner_id == user_id).order_by(models.JournalEntry.created_at.desc()).offset(skip).limit(limit).all()

def create_user_entry(db: Session, entry: schemas.JournalEntryCreate, user_id: int):
    db_entry = models.JournalEntry(**entry.model_dump(), owner_id=user_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def create_entry_insight(db: Session, insight: dict, entry_id: int):
    db_insight = models.EntryInsight(**insight, entry_id=entry_id)
    db.add(db_insight)
    db.commit()
    db.refresh(db_insight)
    return db_insight

def get_narrative_summaries(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.NarrativeSummary).filter(models.NarrativeSummary.user_id == user_id).order_by(models.NarrativeSummary.created_at.desc()).offset(skip).limit(limit).all()

def create_narrative_summary(db: Session, summary: schemas.NarrativeSummaryCreate, user_id: int):
    db_summary = models.NarrativeSummary(**summary.model_dump(), user_id=user_id)
    db.add(db_summary)
    db.commit()
    db.refresh(db_summary)
    return db_summary
