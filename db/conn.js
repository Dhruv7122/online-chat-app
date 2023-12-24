const mongoose = require("mongoose");

//database conection
mongoose.connect(process.env.DB).then().catch((err)=>{
    console.log(err);
});