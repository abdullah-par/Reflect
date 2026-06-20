from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
import datetime

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    entries = relationship("JournalEntry", back_populates="owner")
    books = relationship("Book", back_populates="owner")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False, default="My Journal")
    cover_image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="books")
    entries = relationship("JournalEntry", back_populates="book")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)  # optional AI-suggested title
    content = Column(Text, index=False)
    content_blocks = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True)

    owner = relationship("User", back_populates="entries")
    book = relationship("Book", back_populates="entries")
    insight = relationship("EntryInsight", back_populates="entry", uselist=False)
    # Diagnostics relationship – one entry can have many AI diagnostics
    diagnostics = relationship("CognitiveDiagnostic", back_populates="entry", cascade="all, delete-orphan")
    edits = relationship("JournalEntryEdit", back_populates="entry", cascade="all, delete-orphan")

class JournalEntryEdit(Base):
    __tablename__ = "journal_entry_edits"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    content_blocks = Column(JSON, nullable=True)
    edited_at = Column(DateTime, default=datetime.datetime.utcnow)

    entry = relationship("JournalEntry", back_populates="edits")

class EntryInsight(Base):
    __tablename__ = "entry_insights"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("journal_entries.id"), unique=True)
    pattern_name = Column(String, nullable=True)
    emotional_tone = Column(String, nullable=True)
    relationships_tracked = Column(JSON, nullable=True)
    takeaway = Column(Text, nullable=True)
    relevant_past_entries = Column(JSON, nullable=True)

    entry = relationship("JournalEntry", back_populates="insight")

class NarrativeSummary(Base):
    __tablename__ = "narrative_summaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    summary_type = Column(String, nullable=False)  # "weekly" or "monthly"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# -------------------------------------------------------------------
# Cognitive Diagnostic – on‑demand AI analysis
# -------------------------------------------------------------------
class CognitiveDiagnostic(Base):
    __tablename__ = "cognitive_diagnostics"

    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # The 3 panels – stored as plain text for flexibility
    mental_architecture = Column(Text)   # current loop/state
    behavioral_blindspot = Column(Text)  # what they can't see
    tactical_fix = Column(Text)          # 3‑step practical system

    # Metadata – useful for UI grouping / filtering
    loop_frequency = Column(Integer, nullable=True)   # how many past matches
    flagged_people = Column(JSON, nullable=True)      # {name: dynamic}
    dominant_pattern = Column(String, nullable=True) # e.g. "stress‑driven output"

    entry = relationship("JournalEntry", back_populates="diagnostics")
