import express from "express"
import passport from "passport"
import passportLocal from "passport-local"
import * as usersModel from "../models/users-superagent.mjs"
import {sessionCookieName} from "../app.mjs"
import DBG from "debug"

const debug = DBG("notes:users-router")

const LocalStrategy = passportLocal.Strategy

export const router = express.Router()

router.get("/login", (req, res, next) => {
  try {
    res.render("login", {title: "Login to Notes", user: req.user})
  } catch (e) {
    next(e)
  }
})

router.post(
  "/login",
  passport.authenticate(
    "local",
    {failureRedirect: "/users/login", successRedirect: "/"}
  )
)

router.get("/logout", (req, res, next) => {
  try {
    req.session.destroy()
    req.logout()
    res.clearCookie(sessionCookieName)
    res.redirect("/")
  } catch (e) {
    next(e)
  }
})

passport.use(
  new LocalStrategy(
    {usernameField: "username", passwordField: "password"},
    async (username, password, done) => {
      try {
        const checkResult = await usersModel.userPasswordCheck(
          username,
          password
        )
        debug("PASSWORD_CHECK: ", checkResult)
        if (checkResult.check) {
          done(null, {id: checkResult.username, username: checkResult.username})
        } else {
          done(null, false, checkResult.message)
        }
      } catch (e) {
        done(e)
      }
    }
  )
)

passport.serializeUser((user, done) => {
  try {
    done(null, user.username)
  } catch (e) {
    done(e)
  }
})

passport.deserializeUser(async (username, done) => {
  try {
    const user = await usersModel.find(username)
    done(null, user)
  } catch (e) {
    done(e)
  }
})

export function initPassport(app) {
  app.use(passport.initialize({userProperty: "user"}))
  app.use(passport.session({secret: "keyboard mouse"}))
}

export function ensureAuthenticated(req, res, next) {
  try {
    // req.user is set by Passport in the deserialize function
    if (req.user) next()
    else res.redirect("/users/login")
  } catch (e) {
    next(e)
  }
}
