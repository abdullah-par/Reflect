from pydantic import BaseModel
from typing import List, Optional
from typing import List, Optional, Dict, Any
import datetime

class EntryInsightBase(BaseModel):
    pattern_name: Optional[str] = None
    emotional_tone: Optional[str] = None
    relationships_tracked: Optional[Dict[str, Any]] = None
    takeaway: Optional[str] = None
    relevant_past_entries: Optional[List[Any]] = None

class EntryInsight(EntryInsightBase):
    id: int
    entry_id: int

    class Config:
        from_attributes = True

class NarrativeSummaryBase(BaseModel):
    period_start: datetime.datetime
    period_end: datetime.datetime
    summary_type: str
    content: str

class NarrativeSummaryCreate(NarrativeSummaryBase):
    pass

class NarrativeSummary(NarrativeSummaryBase):
    id: int
    user_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class BookBase(BaseModel):
    title: str = "My Journal"
    cover_image_url: Optional[str] = None

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    owner_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ContentBlockMark(BaseModel):
    type: str
    start: int
    end: int

class ContentBlock(BaseModel):
    id: str
    type: str
    text: str
    marks: Optional[List[ContentBlockMark]] = None
    fontFamily: Optional[str] = None
    fontSize: Optional[int] = None

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_blocks: Optional[List[ContentBlock]] = None
    book_id: Optional[int] = None

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    created_at: datetime.datetime
    owner_id: int
    insight: Optional[EntryInsight] = None

    class Config:
        from_attributes = True

# New schemas for edits
class JournalEntryEditBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_blocks: Optional[List[ContentBlock]] = None

class JournalEntryEditCreate(JournalEntryEditBase):
    pass

class JournalEntryEdit(JournalEntryEditBase):
    id: int
    entry_id: int
    edited_at: datetime.datetime

    class Config:
        from_attributes = True



class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    entries: List[JournalEntry] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class CognitiveDiagnosticBase(BaseModel):
    entry_id: int
    mental_architecture: str
    behavioral_blindspot: str
    tactical_fix: str
    loop_frequency: Optional[int] = None
    flagged_people: Optional[Dict[str, Any]] = None
    dominant_pattern: Optional[str] = None

class CognitiveDiagnosticCreate(CognitiveDiagnosticBase):
    pass

class CognitiveDiagnostic(CognitiveDiagnosticBase):
    id: int

    class Config:
        from_attributes = True

