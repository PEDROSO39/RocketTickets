import sqlite3
import hashlib
import secrets
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(__file__).resolve().parent / "prax_users.db"
ENV_PATH = ROOT_DIR / "backend" / ".env"


def _hash_password(password: str, salt: str = "") -> str:
    if not salt:
        salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${h.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    salt, _ = stored.split("$", 1)
    return _hash_password(password, salt) == stored


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()


def create_user(username: str, email: str, password: str, full_name: str = "") -> dict:
    conn = get_connection()
    try:
        password_hash = _hash_password(password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, full_name),
        )
        conn.commit()
        return {"id": cursor.lastrowid, "username": username, "email": email}
    except sqlite3.IntegrityError as e:
        if "username" in str(e):
            raise ValueError("Nome de usuario ja existe")
        elif "email" in str(e):
            raise ValueError("Email ja cadastrado")
        raise
    finally:
        conn.close()


def authenticate(identifier: str, password: str) -> dict | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        (identifier, identifier),
    ).fetchone()
    conn.close()
    if row and _verify_password(password, row["password_hash"]):
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "full_name": row["full_name"],
        }
    return None


def user_exists() -> bool:
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return count > 0


def create_reset_token(username_or_email: str) -> str | None:
    conn = get_connection()
    row = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (username_or_email, username_or_email),
    ).fetchone()
    if not row:
        conn.close()
        return None
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))",
        (row["id"], token),
    )
    conn.commit()
    conn.close()
    return token


def reset_password(token: str, new_password: str) -> bool:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')",
        (token,),
    ).fetchone()
    if not row:
        conn.close()
        return False
    password_hash = _hash_password(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, row["user_id"]))
    conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (row["id"],))
    conn.commit()
    conn.close()
    return True


def change_password(user_id: int, current_password: str, new_password: str) -> bool:
    conn = get_connection()
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row or not _verify_password(current_password, row["password_hash"]):
        conn.close()
        return False
    password_hash = _hash_password(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user_id))
    conn.commit()
    conn.close()
    return True


def save_praxio_user(username: str, password: str, full_name: str = "") -> dict:
    conn = get_connection()
    email = f"{username}@praxio.local"
    row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if row:
        password_hash = _hash_password(password)
        conn.execute("UPDATE users SET password_hash = ?, full_name = ? WHERE id = ?",
                     (password_hash, full_name or username, row["id"]))
        conn.commit()
        user_id = row["id"]
    else:
        password_hash = _hash_password(password)
        cursor = conn.execute(
            "INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, full_name or username),
        )
        conn.commit()
        user_id = cursor.lastrowid
    conn.close()
    return {"id": user_id, "username": username, "email": email, "full_name": full_name or username}


def update_env_credentials(username: str, password: str):
    if not ENV_PATH.exists():
        return
    lines = ENV_PATH.read_text(encoding="utf-8").splitlines()
    updated = {"PRAXIO_USERNAME": False, "PRAXIO_PASSWORD": False}
    for i, line in enumerate(lines):
        if line.startswith("PRAXIO_USERNAME="):
            lines[i] = f"PRAXIO_USERNAME={username}"
            updated["PRAXIO_USERNAME"] = True
        elif line.startswith("PRAXIO_PASSWORD="):
            lines[i] = f"PRAXIO_PASSWORD={password}"
            updated["PRAXIO_PASSWORD"] = True
    if not updated["PRAXIO_USERNAME"]:
        lines.append(f"PRAXIO_USERNAME={username}")
    if not updated["PRAXIO_PASSWORD"]:
        lines.append(f"PRAXIO_PASSWORD={password}")
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
