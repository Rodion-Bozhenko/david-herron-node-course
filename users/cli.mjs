import {program} from "commander"
import restify from "restify-clients"
import * as util from "util"
import bcrypt from "bcrypt"

async function hashpass(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

let client_port
let client_host
let client_version = "*"
let client_protocol
let authId = "them"
let authCode = "D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF"

const client = (program) => {
  const options = program.opts()
  if (typeof process.env.PORT === "string") client_port = parseInt(process.env.PORT)
  if (typeof options.port === "string") client_port = parseInt(options.port)
  if (typeof options.host === "string") client_host = options.host
  if (typeof options.url === "string") {
    let purl = new URL(options.url)
    if (purl.host) client_host = purl.host
    if (purl.port) client_port = purl.port
    if (purl.protocol) client_protocol = purl.protocol
  }
  let connect_url = new URL("http://localhost:5858")
  if (client_protocol) connect_url.protocol = client_protocol
  if (client_host) connect_url.host = client_host
  if (client_port) connect_url.port = client_port
  let client = restify.createJSONClient({
    url: connect_url.href,
    version: client_version
  })
  client.basicAuth(authId, authCode)
  return client
}

program
  .option("-p, --port <port>", "Port number for user server, if using localhost")
  .option("-h, --host <host>", "Port number for user server, if using localhost")
  .option("-u, --url <url>", "Connection URL for user server, if using a remote server")


program
  .command("add <username>")
  .description("Add a user to the user server")
  .option("--password <password>", "Password for new user")
  .option("--family-name <familyName>", "Family name, or last name, if the user")
  .option("--given-name <givenName>", "Given name, or first name, of the user")
  .option("--middle-name <middleName>", "Middle name of the user")
  .option("--email <email>", "Email address for the user")
  .action(async (username, cmdObj) => {
    const toPost = {
      username,
      password: await hashpass(cmdObj.password),
      provider: "local",
      familyName: cmdObj.familyName,
      givenName: cmdObj.givenName,
      middleName: cmdObj.middleName,
      emails: [],
      photos: []
    }
    if (typeof cmdObj.email !== "undefined") toPost.emails.push(cmdObj.email)
    client(program).post("/create-user", toPost, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log("Created " + util.inspect(obj))
    })
  })
program
  .command("find-or-create <username>")
  .description("Add a user to the user server")
  .option("--password <password>", "Password for new user")
  .option("--family-name <familyName>", "Family name, or last name, of the user")
  .option("--given-name <givenName>", "Given name, or first name, of the user")
  .option("--middle-name <middleName>", "Middle name of the user")
  .option("--email <email>", "Email address for the user")
  .action(async (username, cmdObj) => {
    const toPost = {
      username,
      password: await hashpass(cmdObj.password),
      provider: "local",
      familyName: cmdObj.familyName,
      givenName: cmdObj.givenName,
      middleName: cmdObj.middleName,
      emails: [],
      photos: []
    }
    if (typeof cmdObj !== "undefined") toPost.emails.push(cmdObj.email)
    client(program).post("/find-or-create", toPost, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log("Found or created " + util.inspect(obj))
    })
  })

program
  .command("find <username>")
  .description("Search for a user on the user server")
  .action((username) => {
    client(program).get(`/find/${username}`, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log("Found " + util.inspect(obj))
    })
  })

program
  .command("list-users")
  .description("List all users on the user server")
  .action(() => {
    client(program).get("/list", (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log(obj)
    })
  })

program
  .command("update <username>")
  .description("Update a user in the user server")
  .option("--password <password>", "Password for new user")
  .option("--family-name <familyName>", "Family name, or last name, if the user")
  .option("--given-name <givenName>", "Given name, or first name, of the user")
  .option("--middle-name <middleName>", "Middle name of the user")
  .option("--email <email>", "Email address for the user")
  .action(async (username, cmdObj) => {
    const toPost = {
      username,
      password: await hashpass(cmdObj.password),
      provider: "local",
      familyName: cmdObj.familyName,
      givenName: cmdObj.givenName,
      middleName: cmdObj.middleName,
      emails: [],
      photos: []
    }
    if (typeof cmdObj.email !== "undefined") toPost.emails.push(cmdObj.email)
    client(program).post(`/update-user/${username}`, toPost, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log("Updated " + util.inspect(obj))
    })
  })

program
  .command("destroy <username>")
  .description("Destroy a user on the user server")
  .action((username) => {
    client(program).del(`/destroy/${username}`, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log("Deleted - result= " + util.inspect(obj))
    })
  })

program
  .command("password-check <username> <password>")
  .description("Check whether the user password checks out")
  .action((username, password) => {
    client(program).post("/password-check", {username, password}, (err, req, res, obj) => {
      if (err) console.error(err.stack)
      else console.log(obj)
    })
  })

program.parse(process.argv)
