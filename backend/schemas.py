from pydantic import BaseModel
from typing import List, Optional
from typing import List, Optional, Dict, Any
import datetime

class EntryInsightBase(BaseModel):
    pattern_name: Optional[str] = None
    emotional_tone: Optional[str] = None
    relationships_tracked: Optional[Dict[str, Any]] = None
    takeaway: Optional[str] = None

class EntryInsight(EntryInsightBase):
    id: int
    entry_id: int

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    content: str

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    created_at: datetime.datetime
    owner_id: int
    insight: Optional[EntryInsight] = None

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

class TokenData(BaseModel):
    email: Optional[str] = None
