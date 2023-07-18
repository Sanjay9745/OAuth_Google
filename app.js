require('dotenv').config();
const express = require('express');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const User = require('./model');
const app = express();
const port = 3000;

// Configure session middleware
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

// Configure Passport.js GoogleStrategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        } else {
          const newUser = new User({
            email: profile.email,
            googleId: profile.id,
          });
          user = await newUser.save();
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user to store in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Define routes
app.get('/', (req, res) => {
  res.send('<a href="http://localhost:3000/auth/google">Sign in With Google</a>');
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/google/failure',
  })
);

app.get('/dashboard', (req, res) => {
  if (req.user) {
    res.send('<div>hello baby <br><a href="http://localhost:3000/logout">Logout</a> </div>');
  } else {
    res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session', err);
      return res.redirect('/'); // Redirect to the home page
    }

    res.redirect('/'); // Redirect to the home page
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
