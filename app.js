//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use
(session({
  secret:"Nuestro pequeño secreto",
  resave: false,
  saveUninitialized: false,
})
);

app.use(passport.initialize());
app.use(passport.session());

//conexion a la base de datos
const uri = "mongodb://127.0.0.1:27017/usuarioDB";
mongoose.connect(uri)
  .then(() => {
    console.log("conexion exitosa");
  })
  .catch((err) => {})
///

const usuarioSchema = new mongoose.Schema({
  correo: String,
  contraseña: String,
  googleId: String,
  secret: String
});

usuarioSchema.plugin(passportLocalMongoose);
usuarioSchema.plugin(findOrCreate);

const Usuario =  mongoose.model("Usuario", usuarioSchema);

passport.use(Usuario.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    Usuario.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res){
res.render("login");
});

app.get("/register", function(req, res){
res.render("register");
});

app.get("/secrets", function (req, res) {
Usuario.find({"secret" : {$ne:null}})
.then((encontrarUs)=> {
  if (encontrarUs) {
    res.render("secrets", {usurioJuntoSuSecret: encontrarUs });
  }
})
. catch((err) => {
  console.log(err);
});
});

app.get("/submit", function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit", function (req, res) {
    const secretosGuardados = req.body.secret;
    Usuario.findById(req.user.id)
      .then((encontrarUs) => {
          if (encontrarUs) {
            encontrarUs.secret = secretosGuardados;
            encontrarUs.save()
      .then(() => {
res.redirect("/secrets");
    });
} else {
  console.log("User not found");
    }
  })
.catch((err) => {
console.log(err);
  });
    });
app.get("/logout", function(req,res){
req.logout(function(err){
  if (err) {
    return next(err);
  } else {
    res.redirect("/");
  }
})

});

app.post("/register", function (req, res) {
  Usuario.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login",async(req,res)=>{
const user = new Usuario ({
  username: req.body.username,
  password: req.body.password
});

req.login(user, function(err){
  if (err) {
    console.log(err);
  } else {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/secrets");
    });
  }
});
});



app.listen(3000,function(){
  console.log("El servidor esta arriba");
});
