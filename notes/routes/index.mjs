import express from "express";
import { NotesStore as notes } from "../models/notes-store.mjs";
import { twitterLogin } from "./users.mjs";
import { io } from "../app.mjs";
import DBG from "debug";

const debug = DBG("notes:home-router");

export const router = express.Router();

/* GET home page. */
router.get("/", async (req, res, next) => {
  try {
    const noteList = await getKeyTitleList();
    res.render("index", {
      title: "Notes",
      noteList,
      user: req.user,
      twitterLogin
    });
  } catch (e) {
    next(e);
  }
});

async function getKeyTitleList() {
  const keyList = await notes.keyList();
  const keyPromises = keyList.map((key) => notes.read(key));
  const noteList = await Promise.all(keyPromises);
  return noteList.map((note) => ({ key: note.key, title: note.title }));
}

export const emitNoteTitles = async () => {
  const noteList = await getKeyTitleList();
  io.of("/home").emit("notetitles", { noteList });
};

export function init() {
  io.of("/home").on("connection", () => {
    debug("socketio connection on /home");
  });
  notes.on("notecreated", emitNoteTitles);
  notes.on("noteupdated", emitNoteTitles);
  notes.on("notedestroyed", emitNoteTitles);
}
