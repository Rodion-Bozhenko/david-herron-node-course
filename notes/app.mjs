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
import {router as indexRouter, init as homeInit} from "./routes/index.mjs"
import {router as notesRouter, init as notesInit} from "./routes/notes.mjs"
import {router as usersRouter, initPassport} from "./routes/users.mjs"
import rfs from "rotating-file-stream"
import DBG from "debug"
import {useModel as useNotesModel} from "./models/notes-store.mjs"
import session from "express-session"
import sessionFileStore from "session-file-store"
import {approotdir} from "./approotdir.mjs"
import dotenv from "dotenv/config.js"
import {Server} from "socket.io"
import passport from "passport"
import RedisStore from "connect-redis"
import {createClient} from "redis"
const dbgerror = DBG("notes:error")
const dbg = DBG("notes:debug")

let sessionStore
dbg("REDIS_ENDPOINT: ", process.env.REDIS_ENDPOINT)
if (process.env.REDIS_ENDPOINT) {
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_ENDPOINT
    }
  })
  redisClient.on("connect", () => dbg("REDIS_CONNECTED"))
  redisClient.on("error", (err) => dbgerror("Redis Client Error", err))
  await redisClient.connect()
  sessionStore = new RedisStore({client: redisClient})
} else {
  const FileStore = sessionFileStore(session)
  sessionStore = new FileStore({path: "sessions"})
}

const __dirname = approotdir

export const sessionCookieName = "notescookie.sid"

const sessionMiddleware = session({
  store: sessionStore,
  secret: "keyboard mouse",
  resave: true,
  saveUninitialized: true,
  name: sessionCookieName
})

useNotesModel(process.env.NOTES_MODEL || "memory")
  .then(() => {
    homeInit()
    notesInit()
  })
  .catch((error) => onError({code: "ENOTESSTORE", error}))

const debug = DBG("notes:debug")
export const app = express()

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
app.use(sessionMiddleware)
initPassport(app)
export const io = new Server(server)
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))
io.use(wrap(passport.initialize()))
io.use(wrap(passport.session()))

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
