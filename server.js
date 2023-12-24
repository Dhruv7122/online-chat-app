
const express = require("express");
const app = express();
const http = require("http").createServer(app);

//env path setting
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

//database connection
require("./db/conn");

//user routes path
const userRoutes = require("./routes/userRoutes");

//using user routes
app.use("/", userRoutes);

//model
const User = require("./models/userModel");
const Chat = require("./models/chatModel");
const requests = require("./models/friendRequestModel");

//socket 
const io = require("socket.io")(http);

//user connection or disconnection in socket
var activeUsers=0;
var us = io.of("/userspace");
us.on("connection", async function (socket) {
    // console.log('user connected');
    const userId = socket.handshake.auth.token;
    const socket_id = socket.id;
    await User.findByIdAndUpdate({ _id: userId }, {
        $set: { 
            is_online: '1',
            socket_id : socket_id,
        }
    });
    activeUsers++;

    //broadcasting user is online
    socket.broadcast.emit('onlineUser', { user_id: userId });

    //chatting implementation
    socket.on('newChat', function (data) {
        socket.broadcast.emit('loadChat', data);
    });

    //old chat & receiver profile
    socket.on('existChats', async function (data) {
        var receiver = await User.findById({ _id: data.receiver_id });
        var chats = await Chat.find({
            $or: [
                {
                    sender_id: data.sender_id,
                    receiver_id: data.receiver_id
                },
                {
                    sender_id: data.receiver_id,
                    receiver_id: data.sender_id
                }
            ]
        });

        socket.emit('oldChats', { chats: chats, receiver: receiver });
    });

    //sending and receiving request
    socket.on("request", async function (data) {
        try {
            var senderUser = await User.findById({ _id: data.sender });
            var receiverUser = await User.findById({ _id: data.receiver });
            // console.log(senderUser);
            // console.log(receiverUser);
            if (!senderUser || !receiverUser) {
                console.log("user not found!!!!");
            }
            us.to(receiverUser.socket_id).emit("new-friend-request",{
                message:"new friend request is arrive" ,
                sender:senderUser,
                request_id:data._id
            });
        } catch (error) {
            console.log(error);
        }
    });


    socket.on("accepted",async function(data){
        const req_doc = await requests.findById(data);

        const sender = await User.findById(req_doc.sender);
        const receiver = await User.findById(req_doc.receiver);

        sender.friends.push(req_doc.receiver);
        receiver.friends.push(req_doc.sender);

        await receiver.save();
        await sender.save();

        await requests.findByIdAndDelete(data);

        us.to(sender.socket_id).emit("request_accepted",{
            newFrd:receiver,
            message:"accepted"
        });
        us.to(receiver.socket_id).emit("request_accepted",{
            newFrd:sender,
            message:"accepted"
        });
    });

    socket.on("rejected",async function(data){
        const req_doc = await requests.findById(data);

        const sender = await User.findById(req_doc.sender);
        const receiver = await User.findById(req_doc.receiver);

        await requests.findByIdAndDelete(data);

        us.to(sender.socket_id).emit("request_rejected",{
            message:"rejected"
        });
        us.to(receiver.socket_id).emit("request_rejected",{
            message:"rejected"
        });
    });

    socket.on("profile-updated",async function(data){
        socket.broadcast.emit('loadName', data);
    });

    socket.broadcast.emit("active-users",{active_users:activeUsers});
    
    //user disconnect
    socket.on('disconnect', async function () {
        await User.findByIdAndUpdate({ _id: userId }, { $set: { is_online: '' } });
        //broadcasting user is offline
        socket.broadcast.emit('offlineUser', { user_id: userId });
        activeUsers--;
        socket.broadcast.emit("active-users",{active_users:activeUsers});
        // console.log('user disconnected');
    });
});


//port
http.listen(process.env.PORT, console.log("server is running on port no: http://localhost:5000/"));