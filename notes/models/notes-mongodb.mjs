import { MongoClient } from "mongodb";
import { AbstractNotesStore, Note } from "./Notes.mjs";

let client;

const connectDB = async () => {
  if (!client) client = await MongoClient.connect(process.env.MONGO_URL);
};

const db = () => client.db(process.env.MONGO_DBNAME);

export default class MongoDBNotesStore extends AbstractNotesStore {
  async close() {
    if (client) client.close();
    client = undefined;
  }

  async update(key, title, body) {
    await connectDB();
    const collection = db().collection("notes");
    await collection.updateOne({ notekey: key }, { $set: { title, body } });
    const note = new Note(key, title, body);
    this.emitUpdated(note);
    return note;
  }

  async create(key, title, body) {
    await connectDB();
    const collection = db().collection("notes");
    await collection.insertOne({ notekey: key, title, body });
    const note = new Note(key, title, body);
    this.emitCreated(note);
    return note;
  }

  async read(key) {
    await connectDB();
    const collection = db().collection("notes");
    const doc = await collection.findOne({ notekey: key });
    return new Note(doc.notekey, doc.title, doc.body);
  }

  async destroy(key) {
    await connectDB();
    const collection = db().collection("notes");
    await collection.deleteOne({ notekey: key });
    this.emitDestroyed(key);
  }

  async keyList() {
    await connectDB();
    const collection = db().collection("notes");
    const keys = [];
    await collection.find({}).forEach((note) => {
      keys.push(note.notekey);
    });
    return keys;
  }

  async count() {
    await connectDB();
    const collection = db().collection("notes");
    return await collection.count({});
  }
}
