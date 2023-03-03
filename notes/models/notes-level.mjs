import { Level } from "level";
import { AbstractNotesStore, Note } from "./Notes.mjs";

let db;

function connectDB() {
  if (typeof db !== "undefined" || db) return db;
  db = new Level(process.env.LEVELDB_LOCATION || "notes.level", {
    createIfMissing: true,
    valueEncoding: "json"
  });
  return db;
}

export default class LevelNotesStore extends AbstractNotesStore {
  async close() {
    const _db = db;
    db = undefined;
    return _db ? _db.close() : undefined;
  }

  async update(key, title, body) {
    const note = createOrUpdate(key, title, body);
    this.emitUpdated(note);
    return note;
  }

  async create(key, title, body) {
    const created = createOrUpdate(key, title, body);
    this.emitCreated(note);
    return note;
  }

  async read(key) {
    const db = connectDB();
    return Note.fromJSON(await db.get(key));
  }

  async destroy(key) {
    const db = await connectDB();
    await db.del(key);
    this.emitDestroyed(key);
  }

  async keyList() {
    const db = await connectDB();
    return await db.keys().all();
  }

  async count() {
    const db = await connectDB();
    let total = 0;
    await new Promise((resolve, reject) => {
      db.on("data", () => total++)
        .on("error", (err) => reject(err))
        .on("end", () => resolve(total));
    });
    return total;
  }
}

async function createOrUpdate(key, title, body) {
  const db = await connectDB();
  const note = new Note(key.trim(), title, body);
  console.log("NOTE: ", note);
  await db.put(key.trim(), note.JSON);
  return note;
}
