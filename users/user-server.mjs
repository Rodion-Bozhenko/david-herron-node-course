import restify from "restify"
import DBG from "debug"
import * as util from "util"
import {
  connectDB,
  createUser,
  findOneUser,
  sanitizedUser,
  SQUser,
  userParams
} from "./users-sequelize.mjs"
import bcrypt from "bcrypt"

const log = DBG("users:service")

const server = restify.createServer({
  name: "User-Auth-Service",
  version: "0.0.1"
})

server.use(restify.plugins.authorizationParser())
server.use(check)
server.use(restify.plugins.queryParser())
server.use(
  restify.plugins.bodyParser({
    mapParams: true
  })
)

server.post("/create-user", async (req, res) => {
  try {
    await connectDB()
    const result = await createUser(req)
    res.contentType = "json"
    res.send(result)
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.post("/find-or-create", async (req, res) => {
  try {
    await connectDB()
    let user = await findOneUser(req.params.username)
    if (!user) {
      user = await createUser(req)
      if (!user) throw new Error("No user created")
    }
    res.contentType = "json"
    res.send(user)
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.get("/find/:username", async (req, res) => {
  try {
    await connectDB()
    const user = await findOneUser(req.params.username)
    if (!user) {
      res.send(404, new Error("Did not find " + req.params.username))
    } else {
      res.contentType = "json"
      res.send(user)
    }
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.get("/list", async (req, res) => {
  try {
    await connectDB()
    let userList = await SQUser.findAll({})
    userList = userList.map((user) => sanitizedUser(user))
    if (!userList) userList = []
    res.contentType = "json"
    res.send(userList)
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.post("/update-user/:username", async (req, res) => {
  try {
    await connectDB()
    let toUpdate = userParams(req)
    await SQUser.update(toUpdate, {where: {username: req.params.username}})
    const result = await findOneUser(req.params.username)
    res.contentType = "json"
    res.send(result)
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.del("/destroy/:username", async (req, res) => {
  try {
    await connectDB()
    const user = await SQUser.findOne({where: {username: req.params.username}})
    if (!user) {
      res.send(404, new Error(`Didn't find requested ${req.params.username} to delete`))
    } else {
      await user.destroy()
      res.contentType = "json"
      res.send({})
    }
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.post("/password-check", async (req, res) => {
  try {
    await connectDB()
    const user = await SQUser.findOne({where: {username: req.params.username}})
    let checked
    if (!user) {
      checked = {
        check: false,
        username: req.params.username,
        message: "Could not find user"
      }
    } else {
      const passwordsEqual = await bcrypt.compare(req.params.password, user.password)
      if (passwordsEqual) {
        checked = {check: true, username: user.username}
      } else {
        checked = {
          check: false,
          username: req.params.username,
          message: "Incorrect username or password"
        }
      }
    }
    res.contentType = "json"
    res.send(checked)
  } catch (e) {
    res.send(500, e.toString())
  }
})

server.listen(process.env.PORT, "localhost", function() {
  log(server.name + " listening at " + server.url)
})

process.on("uncaughtException", function(err) {
  console.error("UNCAUGHT EXCEPTION - " + (err.stack || err.toString()))
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error(`UNHANDLED PROMISE REJECTION: ${util.inspect(promise)} reason: ${reason}`)
  process.exit(1)
})

const apiKeys = [{user: "them", key: "D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF"}]

function check(req, res, next) {
  if (req.authorization && req.authorization.basic) {
    let found = false
    for (let auth of apiKeys) {
      if (
        auth.key === req.authorization.basic.password &&
        auth.user === req.authorization.basic.username
      ) {
        found = true
        break
      }
    }
    if (found) {
      next()
    } else {
      res.send(401, new Error("Not authenticated"))
      next(false)
    }
  } else {
    res.send(500, new Error("No Authorization Key"))
    next(false)
  }
}
