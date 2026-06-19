import os
import json
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

load_dotenv()

# Initialize Embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize Vector Store
vectorstore = Chroma(
    collection_name="journal_entries",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)

# Initialize LLM
llm = ChatGroq(
    temperature=0.3,
    model_name="llama-3.1-8b-instant",
    groq_api_key=os.getenv("GROQ_API_KEY")
)

INSIGHT_PROMPT = """
You are a wise, observant friend reading a journal entry. Your job is to analyze the entry and provide insights based on the user's past history.
Return ONLY a raw JSON object with no markdown formatting. Do not wrap it in ```json.

New Entry:
"{new_entry}"

Relevant Past Entries from this user:
{past_entries}

Generate a JSON object with the following keys:
- "pattern_name": (string) The emotional/behavioral loop identified (e.g. "Over-commitment driven by fear"). Keep it short and plainly named.
- "emotional_tone": (string) The mood of this entry (e.g. "Anxious", "Content", "Drained").
- "relationships_tracked": (dict) Mentioned people/situations and whether they are positive/negative/neutral (e.g. {{"work presentations": "negative", "Sarah": "positive"}}).
- "takeaway": (string) A practical, specific, non-preachy piece of advice rooted in their actual situation. If this is a recurring pattern, gently point that out.

JSON:
"""
prompt = PromptTemplate(template=INSIGHT_PROMPT, input_variables=["new_entry", "past_entries"])

def process_entry(new_entry_content: str, user_id: int):
    # 1. Retrieve past entries
    # Filter by user_id
    try:
        retrieved_docs = vectorstore.similarity_search(
            query=new_entry_content, 
            k=3, 
            filter={"user_id": user_id}
        )
        past_entries = "\n\n".join([doc.page_content for doc in retrieved_docs])
    except Exception as e:
        past_entries = "No relevant past entries found."
        retrieved_docs = []

    # 2. Generate Insight
    try:
        chain = prompt | llm
        response = chain.invoke({"new_entry": new_entry_content, "past_entries": past_entries})
        
        # Parse JSON
        raw_output = response.content.strip()
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:-3]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:-3]
            
        insight_data = json.loads(raw_output)
    except Exception as e:
        print("LLM Error:", e)
        insight_data = {
            "pattern_name": "Unknown",
            "emotional_tone": "Unknown",
            "relationships_tracked": {},
            "takeaway": "Keep journaling to discover patterns."
        }

    # 3. Save new entry to Vector Store
    vectorstore.add_texts(
        texts=[new_entry_content],
        metadatas=[{"user_id": user_id}]
    )

    return insight_data, retrieved_docs

# -------------------------------------------------------------------
# Diagnostic Function – on‑demand cognitive analysis
# -------------------------------------------------------------------
DIAGNOSTIC_PROMPT = """
You are the core intelligence engine of Project Reflect.
Persona: Industrial Psychologist + Strategic Systems Thinker.

RULES:
- No generic motivation. Radical candor only.
- Treat emotional distress as a loop with a trigger.
- Name social dynamics directly (transactional, status‑posturing, etc).
- End with a concrete 3‑step protocol executable TODAY.

Current entry:
"{entry}"

Past 30‑day entries (for pattern frequency):
{past_entries}

Loop match count (how many past entries share this pattern): {loop_count}

Return ONLY raw JSON:
{{
  "dominant_pattern": "short name of the loop",
  "loop_frequency": {loop_count},
  "mental_architecture": "2-3 sentences on current cognitive state",
  "behavioral_blindspot": "what they cannot see in their own words",
  "tactical_fix": "Step 1: ... Step 2: ... Step 3: ...",
  "flagged_people": {{"Actual Person Name": "dynamic (transactional/supportive/draining)"}}
}}
"""

diag_prompt = PromptTemplate(template=DIAGNOSTIC_PROMPT, input_variables=["entry", "past_entries", "loop_count"])

def run_diagnostic(entry_content: str, user_id: int) -> dict:
    # Retrieve past 30‑day entries (k=10 for a broader context)
    try:
        docs = vectorstore.similarity_search(
            query=entry_content,
            k=10,
            filter={"user_id": user_id}
        )
        past = "\n---\n".join([d.page_content[:300] + ("..." if len(d.page_content) > 300 else "") for d in docs])
        loop_count = len(docs)
    except Exception as e:
        print("Vector store error in diagnostic:", e)
        past = ""
        loop_count = 0

    # Build and invoke LLM chain
    try:
        chain = diag_prompt | llm
        response = chain.invoke({
            "entry": entry_content,
            "past_entries": past,
            "loop_count": loop_count
        })
        raw = response.content.strip()
        if raw.startswith("```json"):
            raw = raw[7:-3]
        if raw.startswith("```"):
            raw = raw[3:-3]
        diagnostic_data = json.loads(raw)
    except Exception as e:
        print("LLM error in diagnostic:", e)
        diagnostic_data = {
            "dominant_pattern": "Unknown",
            "loop_frequency": loop_count,
            "mental_architecture": "",
            "behavioral_blindspot": "",
            "tactical_fix": "",
            "flagged_people": {}
        }
    return diagnostic_data

NARRATIVE_PROMPT = """
You are a wise, observant biographer reading a person's journal entries for a recent period.
Your job is to compile these entries into a short, beautifully written narrative summary.
It should not be a list of bullet points, but rather a story arc of their period: what happened, what emotional patterns or loops showed up, how their mood evolved, and what shifted or stayed the same.
The tone must be that of a wise, observant friend - never clinical, never robotic, never preachy. It should read like a chapter of a personal book.

Journal Entries:
{entries_content}

Write the narrative chapter now:
"""

narrative_prompt_template = PromptTemplate(template=NARRATIVE_PROMPT, input_variables=["entries_content"])

def generate_narrative_summary(entries: list) -> str:
    if not entries:
        return "No entries recorded during this period to summarize."
        
    entries_formatted = []
    for entry in entries:
        created_str = entry.created_at.strftime("%Y-%m-%d %H:%M")
        entries_formatted.append(f"Date: {created_str}\nContent: {entry.content}")
        
    entries_content = "\n\n---\n\n".join(entries_formatted)
    
    try:
        chain = narrative_prompt_template | llm
        response = chain.invoke({"entries_content": entries_content})
        return response.content.strip()
    except Exception as e:
        print("LLM Error in narrative summary:", e)
        return "Could not generate summary due to an error. Please try again."
