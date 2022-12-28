import express from 'express'
import {NotesStore as notes} from "../app.mjs"
export const router = express.Router()

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const keyList = await notes.keyList()
    const keyPromises = keyList.map(key => notes.read(key))
    const noteList = await Promise.all(keyPromises)
    res.render('index', {title: 'Notes', noteList});
  } catch (e) {
    next(e)
  }
});

