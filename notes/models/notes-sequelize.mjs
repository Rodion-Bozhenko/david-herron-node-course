import { Model, DataTypes } from "sequelize";
import {
  connectDB as connectSequelize,
  close as closeSequelize
} from "./sequelize.mjs";
import { AbstractNotesStore, Note } from "./Notes.mjs";

let sequelize;

export class SQNote extends Model {
}

async function connectDB() {
  if (sequelize) return;
  sequelize = await connectSequelize();
  SQNote.init(
    {
      notekey: { type: DataTypes.STRING, primaryKey: true, unique: true },
      title: DataTypes.STRING,
      body: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: "SQNote"
    }
  );
  await SQNote.sync();
}

export default class SequelizeNotesStore extends AbstractNotesStore {
  async close() {
    await closeSequelize();
    sequelize = undefined;
  }

  async update(key, title, body) {
    await connectDB();
    const note = await SQNote.findOne({ where: { notekey: key } });
    if (!note) {
      throw new Error(`No note found for ${key}`);
    } else {
      await SQNote.update({ title, body }, { where: { notekey: key } });
      const note = this.read(key);
      this.emitUpdated(note);
      return note;
    }
  }

  async create(key, title, body) {
    await connectDB();
    const sqnote = await SQNote.create({
      notekey: key,
      title,
      body
    });
    const note = new Note(sqnote.notekey, sqnote.title, sqnote.body);
    this.emitCreated(note);
    return note;
  }

  async read(key) {
    await connectDB();
    const note = await SQNote.findOne({ where: { notekey: key } });
    if (!note) {
      throw new Error(`No note found for ${key}`);
    } else {
      return new Note(note.notekey, note.title, note.body);
    }
  }

  async destroy(key) {
    await connectDB();
    await SQNote.destroy({ where: { notekey: key } });
    this.emitDestroyed(key);
  }

  async keyList() {
    await connectDB();
    const notes = await SQNote.findAll({ attributes: ["notekey"] });
    return notes.map((note) => note.notekey);
  }

  async count() {
    await connectDB();
    return await SQNote.count();
  }
}
