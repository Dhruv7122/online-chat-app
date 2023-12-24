const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:false
    },
    password:{
        type:String,
        required:true
    },
    is_online:{
        type:String,
        default:""
    },
    loginCount:{
        type:mongoose.Schema.Types.Decimal128,
        default:0
    },
    friends:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    socket_id:String
},
{
    timestamps:true
});

module.exports = mongoose.model("users",userSchema);