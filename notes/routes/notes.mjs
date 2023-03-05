import express from "express"
import {NotesStore as notes} from "../models/notes-store.mjs"
import {ensureAuthenticated, twitterLogin} from "./users.mjs"
import DBG from "debug"
import {io} from "../app.mjs"
import {emitNoteTitles} from "./index.mjs"
import {
  postMessage,
  destroyMessage,
  recentMessages,
  emitter as msgEvents
} from "../models/messages-sequelize.mjs"
import DBG from "debug"
const debug = DBG("notes:home")
const error = DBG("notes:error-home")

const debug = DBG("notes:debug")
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
    debug({docreate, notekey, title, body})
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

export function init() {
  io.of("/notes").on("connection", (socket) => {
    const noteKey = socket.handshake.query.key
    if (noteKey) {
      socket.join(noteKey)

      socket.on("create-message", async (newMsg, fn) => {
        try {
          await postMessage(
            newMsg.from,
            newMsg.namespace,
            newMsg.room,
            newMsg.message
          )
          fn("ok")
        } catch (e) {
          error(`FAIL to create message ${e.stack || e.toString()}`)
        }
      })

      socket.on("delete-message", async (data) => {
        try {
          await destroyMessage(data.id)
        } catch (e) {
          error(`FAIL to delete message with id ${data.id} - ${e.stack || e.toString()}`)
        }
      })
    }
  })
  notes.on("noteupdated", async (note) => {
    const toEmit = {
      key: note.key,
      title: note.title,
      body: note.body
    }
    io.of("/notes").to(note.key).emit("noteupdated", toEmit)
    await emitNoteTitles()
  })
  notes.on("notedestroyed", async (key) => {
    io.of("/notes").to(key).emit("notedestroyed", key)
    await emitNoteTitles()
  })
  msgEvents.on("newmessage", (newMsg) => {
    io.of(newMsg.namespace).to(newMsg.room).emit("newmessage", newMsg)
  })
  msgEvents.on("destroymessage", (data) => {
    io.of(data.namespace).to(data.room).emit("destroymessage", data)
  })
}
