import express from "express"
import passport from "passport"
import passportLocal from "passport-local"
import * as usersModel from "../models/users-superagent.mjs"
import {sessionCookieName} from "../app.mjs"
import DBG from "debug"
import passportTwitter from "passport-twitter"

const debug = DBG("notes:users-router")
const dbgerror = DBG("notes:error-users")

const LocalStrategy = passportLocal.Strategy
const TwitterStrategy = passportTwitter.Strategy

export const router = express.Router()

export function initPassport(app) {
  app.use(passport.initialize())
  app.use(passport.session())
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

// Local Strategy
router.get("/login", (req, res, next) => {
  try {
    res.render("login", {title: "Login to Notes", user: req.user})
  } catch (e) {
    next(e)
  }
})

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    successRedirect: "/"
  })
)

router.get("/logout", (req, res, next) => {
  try {
    req.logout(function(err) {
      if (err) return next(err)
      res.clearCookie(sessionCookieName)
      res.redirect("/")
    })
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

// Twitter Strategy

const twitterCallback =
  process.env.TWITTER_CALBACK_HOST || "http://localhost:3000"
export let twitterLogin = false

if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: `${twitterCallback}/users/auth/twitter/callback`
      },
      async function(token, tokenSecret, profile, done) {
        try {
          const user = await usersModel.findOrCreate({
            id: profile.username,
            username: profile.username,
            password: "",
            provider: profile.provider,
            familyName: profile.displayName,
            givenName: "",
            middleName: "",
            photos: profile.photos,
            emails: profile.emails
          })
          done(null, user)
          twitterLogin = true
        } catch (e) {
          dbgerror(e)
          done(e)
        }
      }
    )
  )
} else {
  twitterLogin = false
}

// Redirects to Twitter login page
router.get("/auth/twitter", passport.authenticate("twitter"))

// Invokes after successful login on Twitter login page
router.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", {
    successRedirect: "/",
    failureRedirect: "/users/login"
  })
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
