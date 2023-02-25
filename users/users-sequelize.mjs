import jsYaml from "js-yaml"
import {promises as fs} from "fs"
import * as util from "util"
import DBG from "debug"
import {DataTypes, Model, Sequelize} from "sequelize"

const log = DBG("users:model-users")
const error = DBG("users:error")

let sequelize

export class SQUser extends Model {
}

export async function connectDB() {
  if (sequelize) return sequelize
  const yamlText = await fs.readFile(process.env.SEQUELIZE_CONNECT, "utf8")
  const params = jsYaml.load(yamlText, "utf8")
  if (process.env.SEQUELIZE_DBNAME) params.dbname = process.env.SEQUELIZE_DBNAME
  if (process.env.SEQUELIZE_DBUSER) params.username = process.env.SEQUELIZE_DBUSER
  if (process.env.SEQUELIZE_DBPASSWD) params.password = process.env.SEQUELIZE_DBPASSWD
  if (process.env.SEQUELIZE_DBHOST) params.params.host = process.env.SEQUELIZE_DBHOST
  if (process.env.SEQUELIZE_DBPORT) params.params.port = process.env.SEQUELIZE_DBPORT
  if (process.env.SEQUELIZE_DBDIALECT) params.params.dialect = process.env.SEQUELIZE_DBDIALECT
  log("Sequelize params " + util.inspect(params))
  sequelize = new Sequelize(params.dbname, params.username, params.password, params.params)
  await sequelize.authenticate()

  SQUser.init({
    username: {type: DataTypes.STRING, unique: true},
    password: DataTypes.STRING,
    provider: DataTypes.STRING,
    familyName: DataTypes.STRING,
    givenName: DataTypes.STRING,
    middleName: DataTypes.STRING,
    emails: DataTypes.STRING(2048),
    photos: DataTypes.STRING(2048)
  }, {
    sequelize,
    modelName: "SQUser"
  })
  await SQUser.sync()
}

export function userParams(req) {
  return {
    username: req.params.username,
    password: req.params.password,
    provider: req.params.provider,
    familyName: req.params.familyName,
    givenName: req.params.givenName,
    middleName: req.params.middleName,
    emails: JSON.stringify(req.params.emails),
    photos: JSON.stringify(req.params.photos)
  }
}

export function sanitizedUser(user) {
  if (!user) return
  const ret = {
    id: user.username,
    username: user.username,
    provider: user.provider,
    familyName: user.familyName,
    givenName: user.givenName,
    middleName: user.middleName
  }
  try {
    ret.emails = JSON.parse(user.emails)
  } catch (e) {
    ret.emails = []
  }
  try {
    ret.photos = JSON.parse(user.photos)
  } catch (e) {
    ret.photos = []
  }
  return ret
}

export async function findOneUser(username) {
  const user = await SQUser.findOne({where: {username}})
  return sanitizedUser(user)
}

export async function createUser(req) {
  const toCreate = userParams(req)
  await SQUser.create(toCreate)
  return await findOneUser(req.params.username)
}
