import express from "express";
import {NotesStore as notes} from "../app.mjs";
export const router = express.Router()

// Add note
router.get("/add", (req, res, next) => {
    res.render("noteedit", {
        title: "Add a Note",
        docreate: true,
        notekey: "",
        note: undefined
    })
})

router.post("/save", async (req, res, next) => {
    try {
        const {docreate, notekey, title, body} = req.body
        let note
        if (docreate === "create") {
            note = await notes.create(notekey, title, body)
        } else {
            note = await notes.update(notekey, title, body)
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
            note
        })
    } catch (e) {
        next(e)
    }
})

router.get("/edit", async (req, res, next) => {
    try {
        const note = await notes.read(req.query.key)
        res.render("noteedit", {
            title: note ? ("Edit " + note.title) : "Add a Note",
            docreate: false,
            notekey: req.query.key,
            note
        })
    } catch (e) {
        next(e)
    }
})

router.get("/destroy", async (req, res, next) => {
    try {
        const note = await notes.read(req.query.key)
        res.render("notedestroy", {
            title: note ? `Delete ${note.title}` : "",
            notekey: req.query.key,
            note
        })
    } catch (e) {
        next(e)
    }
})

router.post("/destroy/confirm", async (req, res, next) => {
    try {
      await notes.destroy(req.body.notekey)
      res.redirect("/")
    } catch (e) {
        next(e)
    }
})