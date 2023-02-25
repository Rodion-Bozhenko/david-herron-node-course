import fs from "fs-extra"
import path from "path"
import {approotdir} from "../approotdir.mjs"
import {Note, AbstractNotesStore} from "./Notes.mjs"

export default class FSNotesStore extends AbstractNotesStore {
  async close() {}
  async update(key, title, body) {
    return createOrUpdate(key, title, body)
  }
  async create(key, title, body) {
    return createOrUpdate(key, title, body)
  }
  async read(key) {
    const notesdir = await notesDir()
    return await readJSON(notesdir, key)
  }
  async destroy(key) {
    const notesdir = await notesDir()
    await fs.unlink(filePath(notesdir, key))
  }
  async keyList() {
    const notesdir = await notesDir()
    let filez = await fs.readdir(notesdir)
    if (!filez || typeof filez === "undefined") filez = []
    const thenotes = filez.map(async (fname) => {
      const key = path.basename(fname, ".json")
      const thenote = await readJSON(notesdir, key)
      return thenote.key
    })
    return Promise.all(thenotes)
  }
  async count() {
    const notesdir = await notesDir()
    const filez = await fs.readdir(notesdir)
    return filez.length
  }
}

async function notesDir() {
  const dir = process.env.NOTES_DS_DIR || path.join(approotdir, "notes-fs-data")
  await fs.ensureDir(dir)
  return dir
}

function filePath(notesdir, key) {
  return path.join(notesdir, `${key}.json`)
}

async function readJSON(notesdir, key) {
  const readFrom = filePath(notesdir, key)
  const data = await fs.readFile(readFrom, "utf8")
  return Note.fromJSON(data)
}

async function createOrUpdate(key, title, body) {
  const notesdir = await notesDir()
  if (key.includes("/")) {
    throw new Error(`key ${key} cannot contain '/'`)
  }
  const note = new Note(key, title, body)
  const writeTo = filePath(notesdir, key)
  const writeJSON = note.JSON
  await fs.writeFile(writeTo, writeJSON, "utf8")
  return note
}
