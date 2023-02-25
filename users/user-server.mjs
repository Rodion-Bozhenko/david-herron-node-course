import restify from "restify"
import DBG from "debug"
import * as util from "util"

const log = DBG("users:service")

const server = restify.createServer({
  name: "User-Auth-Service"
})

server.use(restify.plugins.authorizationParser())
server.use(check)
server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser({
  mapParams: true
}))

server.listen(process.env.PORT, "localhost", function() {
  log(server.name + " listening at " + server.debugInfo().port)
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
      if (auth.key === req.authorization.basic.password && auth.user === req.authorization.basic.username) {
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
