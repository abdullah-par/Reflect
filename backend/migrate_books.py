import sqlite3
import datetime

def migrate():
    conn = sqlite3.connect('antigravity.db')
    cursor = conn.cursor()

    print("Starting Book migration...")

    # 1. Create `books` table
    try:
        cursor.execute("""
            CREATE TABLE books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER,
                title VARCHAR NOT NULL,
                cover_image_url VARCHAR,
                created_at DATETIME,
                FOREIGN KEY(owner_id) REFERENCES users(id)
            )
        """)
        print("Created `books` table.")
    except sqlite3.OperationalError as e:
        print(f"`books` table might already exist: {e}")

    # 2. Add `book_id` to `journal_entries`
    try:
        cursor.execute("ALTER TABLE journal_entries ADD COLUMN book_id INTEGER REFERENCES books(id)")
        print("Added `book_id` to `journal_entries`.")
    except sqlite3.OperationalError as e:
        print(f"`book_id` column might already exist: {e}")

    # 3. Create a default book for each existing user
    cursor.execute("SELECT id FROM users")
    users = cursor.fetchall()

    for (user_id,) in users:
        # Check if user already has a book
        cursor.execute("SELECT id FROM books WHERE owner_id = ?", (user_id,))
        existing_book = cursor.fetchone()

        if not existing_book:
            now_str = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
            cursor.execute("""
                INSERT INTO books (owner_id, title, created_at)
                VALUES (?, ?, ?)
            """, (user_id, "My First Journal", now_str))
            book_id = cursor.lastrowid
            print(f"Created default book (ID: {book_id}) for user (ID: {user_id})")
        else:
            book_id = existing_book[0]

        # 4. Migrate existing entries to this book
        cursor.execute("""
            UPDATE journal_entries
            SET book_id = ?
            WHERE owner_id = ? AND book_id IS NULL
        """, (book_id, user_id))
        if cursor.rowcount > 0:
            print(f"Migrated {cursor.rowcount} entries for user {user_id} to book {book_id}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
