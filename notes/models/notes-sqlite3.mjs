import { Note, AbstractNotesStore } from "./Notes.mjs";
import sqlite from "sqlite3";

let db;

async function connectDB() {
  if (db) return db;
  const dbfile = process.env.SQLITE_FILE || "notes.sqlite3";
  await new Promise((resolve, reject) => {
    db = new sqlite.Database(
      dbfile,
      sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
      (err) => {
        if (err) return reject(err);
        resolve(db);
      }
    );
  });
  return db;
}

export default class SQLITE3NotesStore extends AbstractNotesStore {
  async close() {
    const _db = db;
    db = undefined;
    return _db
      ? new Promise((resolve, reject) => {
        _db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      })
      : undefined;
  }

  async update(key, title, body) {
    const db = await connectDB();
    const note = new Note(key, title, body);
    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE notes " + "SET title = ?, body = ? WHERE notekey = ?",
        [title, body, key],
        (err) => {
          if (err) return reject(err);
          resolve(note);
        }
      );
    });
    this.emitUpdated(note);
    return note;
  }

  async create(key, title, body) {
    const db = await connectDB();
    const note = new Note(key, title, body);
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO notes ( notekey, title, body ) " + "VALUES ( ?, ? , ?);",
        [key, title, body],
        (err) => {
          if (err) return reject(err);
          resolve(note);
        }
      );
    });
    this.emitCreated(note);
    return note;
  }

  async read(key) {
    const db = await connectDB();
    return await new Promise((resolve, reject) => {
      db.get("SELECT * FROM notes WHERE notekey = ?", [key], (err, row) => {
        if (err) return reject(err);
        const note = new Note(row.notekey, row.title, row.body);
        resolve(note);
      });
    });
  }

  async destroy(key) {
    const db = await connectDB();
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM notes WHERE notekey = ?;", [key], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    this.emitDestroyed(key);
  }

  async keyList() {
    const db = await connectDB();
    return await new Promise((resolve, reject) => {
      db.all("SELECT notekey FROM notes", (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map((row) => row.notekey));
      });
    });
  }

  async count() {
    const db = await connectDB();
    return await new Promise((resolve, reject) => {
      db.get("select count(notekey) as count from notes", (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      });
    });
  }
}
