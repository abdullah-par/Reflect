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
    model_name="llama3-8b-8192",
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
