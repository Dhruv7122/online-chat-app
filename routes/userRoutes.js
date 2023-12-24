const path = require("path");
const multer = require("multer");
const express = require("express");
const user_routes = express();

//session 
const session = require("express-session");
user_routes.use(session({
    secret: process.env.SECRET_SESSION,
    resave: true,
    saveUninitialized: false
}));

//parsing req.body into json format
const bodyParser = require("body-parser");
user_routes.use(bodyParser.json());
user_routes.use(bodyParser.urlencoded({ extended: true }));

//setting view engine & path 
user_routes.set("view engine", "hbs");
user_routes.set("views", "./views");

//setting static folder of app
user_routes.use(express.static("public"));


//storing avatar
const Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: Storage });

//controller path
const userController = require("../controllers/userController");
const auth = require("../middlewares/auth");
//routes for requests
user_routes.post("/register", upload.single('image'), userController.register);
user_routes.get("/", auth.islogout, userController.registerLoad);
user_routes.post("/", userController.login);
user_routes.get("/logout", auth.islogin, userController.logout);
user_routes.get("/dashboard", auth.islogin, userController.dashboard);
user_routes.post("/save-chat", userController.savechat);
user_routes.post("/searchuser", userController.searchusers);
user_routes.post("/addFriend", userController.sendRequest);
user_routes.post("/getrequests", userController.getRequests);
user_routes.post("/update-profile",userController.updateProfile);
user_routes.post("/generate-report",userController.report);



//exports user routes
module.exports = user_routes;