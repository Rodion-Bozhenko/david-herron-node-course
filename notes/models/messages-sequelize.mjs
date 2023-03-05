import {
  connectDB as connectSequelize,
  close as closeSequelize
} from "./sequelize.mjs"
import EventEmitter from "events"
import {DataTypes, Model} from "sequelize"

class MessagesEmitter extends EventEmitter {}
export const emitter = new MessagesEmitter()

let sequelize
export class SQMessage extends Model {}

async function connectDB() {
  if (sequelize) return
  sequelize = await connectSequelize()

  SQMessage.init(
    {
      id: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
      from: DataTypes.STRING,
      namespace: DataTypes.STRING,
      room: DataTypes.STRING,
      message: DataTypes.STRING,
      timestamp: DataTypes.DATE
    },
    {
      hooks: {
        afterCreate(message) {
          const toEmit = sanitizedMessage(message)
          emitter.emit("newmessage", toEmit)
        },
        afterDestroy(message) {
          emitter.emit("destroymessage", {
            id: message.id,
            namespace: message.namespace,
            room: message.room
          })
        }
      },
      sequelize,
      modelName: "SQMessage"
    }
  )
  await SQMessage.sync()
}

function sanitizedMessage(msg) {
  return {
    id: msg.id,
    from: msg.from,
    namespace: msg.namespace,
    room: msg.room,
    message: msg.message,
    timestamp: msg.timestamp
  }
}

export async function postMessage(from, namespace, room, message) {
  await connectDB()
  await SQMessage.create({
    from,
    namespace,
    room,
    message,
    timestamp: new Date()
  })
}

export async function destroyMessage(id) {
  await connectDB()
  await SQMessage.destroy({where: {id}})
}

export async function recentMessages(namespace, room) {
  await connectDB()
  const messages = await SQMessage.findAll({
    where: {namespace, room},
    order: [["timestamp", "DESC"]],
    limit: 20
  })
  const msgs = messages.map((message) => sanitizedMessage(message))
  return msgs?.length ? msgs : undefined
}
