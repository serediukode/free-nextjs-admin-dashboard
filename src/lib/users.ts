import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_DB = path.join(DATA_DIR, "users.db");

let _db: Database.Database | null = null;

function db(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(USERS_DB);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return _db;
}

export type StoredUser = {
  id: number;
  email: string;
  name: string | null;
  password_hash: string;
  role: string;
  created_at: string;
};

export function userCount(): number {
  return (db().prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return db()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as StoredUser | undefined;
}

export async function createUser(args: { email: string; password: string; name?: string }) {
  const email = args.email.toLowerCase().trim();
  if (!email || !args.password) throw new Error("email and password required");
  if (args.password.length < 8) throw new Error("password must be at least 8 characters");
  if (findUserByEmail(email)) throw new Error("user already exists");
  const password_hash = await bcrypt.hash(args.password, 10);
  const stmt = db().prepare(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)"
  );
  const info = stmt.run(email, args.name?.trim() || null, password_hash);
  return Number(info.lastInsertRowid);
}

export async function verifyUser(email: string, password: string): Promise<StoredUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}
