const mongoose = require("mongoose");

const friendRequestschema = new mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }
},
{
    timestamps:true
});

module.exports = mongoose.model("requests",friendRequestschema);