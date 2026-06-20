import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "antigravity.db")

def upgrade():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Add content_blocks to journal_entries
    try:
        cursor.execute("ALTER TABLE journal_entries ADD COLUMN content_blocks JSON;")
        print("Added content_blocks to journal_entries")
    except sqlite3.OperationalError as e:
        print(f"Skipped journal_entries: {e}")

    # Add content_blocks to journal_entry_edits
    try:
        cursor.execute("ALTER TABLE journal_entry_edits ADD COLUMN content_blocks JSON;")
        print("Added content_blocks to journal_entry_edits")
    except sqlite3.OperationalError as e:
        print(f"Skipped journal_entry_edits: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    upgrade()
