import {promises as fs} from "fs"
import jsYaml from "js-yaml"
import {Sequelize} from "notes/models/sequelize.mjs"

let sequelize

export async function connectDB() {
  if (typeof sequelize === "undefined") {
    const yamlText = await fs.readFile(process.env.SEQUELIZE_CONNECT, "utf8")
    const params = jsYaml.load(yamlText, "utf8")
    if (process.env.SEQUELIZE_DBNAME)
      params.dbname = process.env.SEQUELIZE_DBNAME
    if (process.env.SEQUELIZE_DBUSER)
      params.username = process.env.SEQUELIZE_DBUSER
    if (process.env.SEQUELIZE_DBPASSWD)
      params.password = process.env.SEQUELIZE_DBPASSWD
    if (process.env.SEQUELIZE_DBHOST)
      params.params.host = process.env.SEQUELIZE_DBHOST
    if (process.env.SEQUELIZE_DBPORT)
      params.params.port = process.env.SEQUELIZE_DBPORT
    if (process.env.SEQUELIZE_DBDIALECT)
      params.params.dialect = process.env.SEQUELIZE_DBDIALECT
    sequelize = new Sequelize(
      params.dbname,
      params.username,
      params.password,
      params.params
    )
    await sequelize.authenticate()
  }
  return sequelize
}

export async function close() {
  if (sequelize) sequelize.close()
  sequelize = undefined
}
