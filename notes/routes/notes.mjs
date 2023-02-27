import express from "express"
import {NotesStore as notes} from "../models/notes-store.mjs"
import {ensureAuthenticated, twitterLogin} from "./users.mjs"

export const router = express.Router()

// Add note
router.get("/add", ensureAuthenticated, (req, res) => {
  res.render("noteedit", {
    title: "Add a Note",
    docreate: true,
    notekey: "",
    user: req.user,
    twitterLogin,
    note: undefined
  })
})

router.post("/save", ensureAuthenticated, async (req, res, next) => {
  try {
    const {docreate, notekey, title, body} = req.body
    console.log("BODY: ", body)
    if (docreate === "create") {
      await notes.create(notekey, title, body)
    } else {
      await notes.update(notekey, title, body)
    }
    res.redirect("/notes/view?key=" + notekey)
  } catch (e) {
    next(e)
  }
})

router.get("/view", async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key)
    res.render("noteView", {
      title: note ? note.title : "",
      notekey: req.query.key,
      user: req.user,
      twitterLogin,
      note
    })
  } catch (e) {
    next(e)
  }
})

router.get("/edit", ensureAuthenticated, async (req, res, next) => {
  try {
    const note = await notes.read(req.query.key)
    res.render("noteedit", {
      title: note ? "Edit " + note.title : "Add a Note",
      docreate: false,
      notekey: req.query.key,
      user: req.user,
      twitterLogin,
      note
    })
  } catch (e) {
    next(e)
  }
})

router.get("/destroy", ensureAuthenticated, async (req, res, next) => {
  try {
    const note = await notes.read(req.query.key)
    res.render("notedestroy", {
      title: note ? `Delete ${note.title}` : "",
      notekey: req.query.key,
      user: req.user,
      twitterLogin,
      note
    })
  } catch (e) {
    next(e)
  }
})

router.post("/destroy/confirm", ensureAuthenticated, async (req, res, next) => {
  try {
    await notes.destroy(req.body.notekey)
    res.redirect("/")
  } catch (e) {
    next(e)
  }
})
