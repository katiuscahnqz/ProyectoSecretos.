//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
///1-instalamos en hyper y requerimos
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const uri = "mongodb://127.0.0.1:27017/usuarioDB";

const app = express();


app.use(express.static("public"));

//2-conectamos la base de datos
mongoose.connect(uri)
  .then(() => {
    console.log("conexion exitosa");
  })
  .catch((err) => {})
///

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

///3-creamos un nuevo esquema para la base de datos

const usuarioSchema = new mongoose.Schema({
  correo: String,
  contraseña: String
});

usuarioSchema.plugin(encrypt, { secret: process.env.SECRETO, encryptedFields: ["contraseña"] });
///4- usamos el schema anterior para configurar el mongoose model y especificamos en "el nombre de la coleccion" en singular

const Usuario =  mongoose.model("Usuario", usuarioSchema);

//////

app.get("/", function(req, res){
res.render("home");
});


app.get("/login", function(req, res){
res.render("login");
});


app.get("/register", function(req, res){
res.render("register");
});

//// recuerda utilizar promesa pra que funcione ya que la explicacion de angela yu esta desactualizada////
//Utiliza o .then o try para que pueda funcionar, segun la documentacion////
/// se debe usar await, por lo que por mi logica lo mejor seria utilizar try ya que este utilza await////
 //5- crea un nuevo usuario y envia a la pag de secretos si la persona se registra

app.post("/register",async function(req,res){
  const newUsuario = new Usuario ({
    correo: req.body.usuario,
    contraseña: req.body.contraseña
  });
  try {
    await newUsuario.save();
    res.render("secrets");
  } catch (error) {
    console.log(error);
  }
});
//5- Aqui validaremos si la persona si se registro efectiamente
app.post("/login",async(req,res)=>{
       const usuario = req.body.usuario;
       const contraseña = req.body.contraseña;

       try {
           const encontrarU = await Usuario.findOne({correo:usuario})
           if(encontrarU){
               if(encontrarU.contraseña===contraseña){
                   res.render('secrets');
               }else{
                   res.send('<h1> Contraseña invalida...</h1>');
               }
           }else{
               res.send("<h1>Usuario no encontrado...</h1>");
           }
       } catch (err) {
           console.log(err);
       }
   });



app.listen(3000,function(){
  console.log("El servidor esta arriba");
});
