const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const requests = require("../models/friendRequestModel");

const bcrypt = require("bcrypt");
const async = require("hbs/lib/async");

var activeUsers = 0;

//login page
const registerLoad = async (req,res) =>{
    try{
        res.render("register");
    }catch(error){
        console.log(error.message);
    }
};

//sign up user
const register = async (req,res) =>{
    try {
        const passHash = await bcrypt.hash(req.body.password,12);
        const user = new User({
            name : req.body.name,
            email : req.body.email,
            image : "images/" + req.file.filename,
            password : passHash
        });
        await user.save();
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
};

//login user
const login = async (req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData) {
            const passMatch =await bcrypt.compare(password,userData.password);
            if(passMatch) {
                req.session.user = userData;
                await User.findByIdAndUpdate(userData._id,{
                    $inc:{
                        loginCount:1
                    }
                });
                activeUsers++;
                console.log("session created.......");
                res.redirect("/dashboard");
            } else {
                res.render("register",{nmsg:true}); 
            }
        }else{
            res.render("register",{nmsg:true});
        }
    } catch (error) {
        console.log(error.message);
    }
}

// logout user
const logout = async (req,res) =>{
    try {
        req.session.destroy(function(){
            activeUsers--;
            console.log("session destroy.......");
        });
        res.redirect("/");
    } catch (error) {
        console.log(error.message);
    }
}

//showing dashboard
const dashboard = async (req,res) =>{
    try {

        //friends of login user
        const this_user = await User.findById(req.session.user._id).populate("friends","_id name image is_online");
        //console.log(this_user);
        //all user on the application except our self
        const users = await User.find({_id:{$nin:[req.session.user._id]}});
        res.render("dashboard",{user:req.session.user, users:this_user.friends});
    } catch (error) {
        console.log(error.message);
    }
}


const savechat = async(req,res)=>{
    try {
        var chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message:req.body.message
        });
        var newChat = await chat.save();
        res.status(200).send({success:true,msg:'chat inserted!',data:newChat});
    } catch (error) {
        console.log(error.message);
    }
}

const searchusers = async(req,res)=>{
    try {
        const name = req.body.name;

        //search user that are register on the application
        const users = await User.find(  
            {
                name:{ $regex: new RegExp(name , "i") } 
            }
        );
        //login user data
        const this_user = await User.findOne({_id:req.session.user._id});

        //users that are not friends of login user
        const remaining_users = users.filter((user)=> !this_user.friends.includes(user._id) && user._id.toString() !== this_user._id.toString());
    
        res.status(200).send({success:true,searchUser:remaining_users});
    } catch (error) {
        console.log(error.message);
    }
}

const sendRequest = async (req, res) => {
    try {
        const { sender, receiver } = req.body;

        // Save the friend request in the database
        const newFriendRequest = new requests({ sender, receiver, status: 'pending' });
        await newFriendRequest.save();

        res.status(200).send({success:true, data:newFriendRequest ,message:"sent successfully"});
    } catch (error) {
        res.status(500).send({ message: 'Server error' });
    }
}

const getRequests = async (req,res) => {
    try {
        const {sender} = req.body;
        const request = await requests.find({
            receiver : sender
        }).populate("sender","_id name image").populate("_id");
        
        // console.log(request);
        res.status(200).send({success:true,data:request});
    } catch (error) {
        console.log(error);
    }
}


const updateProfile = async (req,res) =>{
    try {
        const id = req.body.sender_id;
        const name = req.body.name;

        await User.findByIdAndUpdate(id,{
            name:name,
        });
        res.status(200).send({success:true,data:{id,name}});
    } catch (error) {
        console.log(error);
    }
}

const report = async(req,res)=>{
    try {
        const id = req.body.id;
        const user = await User.findById(id);
        const count = user.loginCount.toString();
        res.status(200).send({success:true,data:count,active:activeUsers});
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    registerLoad,
    register,
    login,
    logout,
    dashboard,
    savechat,
    searchusers,
    sendRequest,
    getRequests,
    updateProfile,
    report
}