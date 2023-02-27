import request from "superagent"
import url from "url"
import DBG from "debug"
import bcrypt from "bcrypt"

const URL = url.URL

const authId = "them"
const authCode = "D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF"

async function hashpass(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

function reqUrl(path) {
  const requrl = new URL(process.env.USER_SERVICE_URL)
  requrl.pathname = path
  return requrl.toString()
}

export async function create(
  username,
  password,
  provider,
  familyName,
  givenName,
  middleName,
  emails,
  photos
) {
  const res = await request
    .post(reqUrl("/create-user"))
    .send({
      username,
      password: await hashpass(password),
      provider,
      familyName,
      givenName,
      middleName,
      emails,
      photos
    })
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)
  return res.body
}

export async function update(
  username,
  password,
  provider,
  familyName,
  givenName,
  middleName,
  emails,
  photos
) {
  const res = await request
    .post(reqUrl(`/update-user/${username}`))
    .send({
      username,
      password: await hashpass(password),
      provider,
      familyName,
      givenName,
      middleName,
      emails,
      photos
    })
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)
  return res.body
}

export async function find(username) {
  const res = await request
    .get(reqUrl(`/find/${username}`))
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)
  return res.body
}

export async function userPasswordCheck(username, password) {
  const res = await request
    .post(reqUrl(`/password-check`))
    .send({username, password})
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)

  return res.body
}

export async function findOrCreate(profile) {
  const res = await request
    .post(reqUrl("/find-or-create"))
    .send({
      username: profile.id,
      password: await hashpass(profile.password),
      provider: profile.provider,
      familyName: profile.familyName,
      givenName: profile.givenName,
      middleName: profile.middleName,
      emails: profile.emails,
      photos: profile.photos
    })
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)
  return res.body
}

export async function listUsers() {
  const res = await request
    .get(reqUrl("/list"))
    .set("Content-Type", "application/json")
    .set("Accept", "application/json")
    .auth(authId, authCode)
  return res.body
}
