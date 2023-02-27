import express from "express"
import hbs from "hbs"
import * as path from "path"
import logger from "morgan"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import * as http from "http"
import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler
} from "./appsupport.mjs"
import {router as indexRouter} from "./routes/index.mjs"
import {router as notesRouter} from "./routes/notes.mjs"
import {router as usersRouter, initPassport} from "./routes/users.mjs"
import rfs from "rotating-file-stream"
import DBG from "debug"
import {useModel as useNotesModel} from "./models/notes-store.mjs"
import session from "express-session"
import sessionFileStore from "session-file-store"
import {approotdir} from "./approotdir.mjs"
import dotenv from "dotenv/config.js"

const __dirname = approotdir

const FileStore = sessionFileStore(session)
export const sessionCookieName = "notescookie.sid"

useNotesModel(process.env.NOTES_MODEL || "memory")
  .then(() => {
  })
  .catch((error) => onError({code: "ENOTESSTORE", error}))

const debug = DBG("notes:debug")
export const app = express()

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "hbs")
hbs.registerPartials(path.join(__dirname, "partials"))
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(
  logger(process.env.REQUEST_LOG_FORMAT || "dev", {
    stream: process.env.REQUEST_LOG_FILE
      ? rfs.createStream(process.env.REQUEST_LOG_FILE, {
        size: "10M",
        interval: "1d",
        compress: "gzip"
      })
      : process.stdout
  })
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(session({
  store: new FileStore({path: "sessions"}),
  secret: "keyboard mouse",
  resave: true,
  saveUninitialized: true,
  name: sessionCookieName
}))
initPassport(app)
app.use(express.static(path.join(__dirname, "public")))
app.use(
  "/assets/vendor/bootstrap",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
)
app.use(
  "/assets/vendor/jquery",
  express.static(path.join(__dirname, "node_modules", "jquery", "dist"))
)
app.use(
  "/assets/vendor/popper.js",
  express.static(
    path.join(__dirname, "node_modules", "popper.js", "dist", "umd")
  )
)
app.use(
  "/assets/vendor/feather-icons",
  express.static(path.join(__dirname, "node_modules", "feather-icons", "dist"))
)
// Router function lists
app.use("/", indexRouter)
app.use("/notes", notesRouter)
app.use("/users", usersRouter)
// error handlers
// catch 404 and forward to error handler
app.use(handle404)
app.use(basicErrorHandler)
export const port = normalizePort(process.env.PORT || "3000")
app.set("port", port)

export const server = http.createServer(app)
server.listen(port)
server.on("error", (err) => onError(err, port))
server.on("listening", () => onListening(server))

server.on("request", (req) => {
  debug(`${new Date().toISOString()} request ${req.method}
   ${req.url}`)
})
