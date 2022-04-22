'use strict'

const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")
const {generateMessage, generateLocationMessage} = require("./utils/messages")
const  {addUser, removeUser, getUser,getUsersInRoom} = require("./utils/users")

const app = express();
const server = http.createServer(app)//we need to do this to use express and socket in the same time
const io = socketio(server)

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,"../public");

app.use(express.json());
app.use(express.static(publicDirectoryPath));


io.on("connection",(socket)=>{
    console.log("New WebSocket connection");

    socket.on("disconnect", ()=>{
        const user = removeUser(socket.id)

        if(!user) return;

        io.to(user.room).emit("message", generateMessage(null, `${user.username} has left!`))

        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    //Send message to all users
    socket.on("sendMessage",(message, callback)=>{
        const user = getUser(socket.id)

        if(!user) return callback("Can't find user with the following id")
        
        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback("Profanity is not allowed")
        }

        io.to(user.room).emit("message", generateMessage(user.username, message))
        callback() //it's function that was provided on the client side js
    })

    //Listen for geolocation 
    socket.on("sendLocation",(latidute,longitude, callback)=>{
        const user = getUser(socket.id)

        if(!user) return callback("Can't find user with the following id")

        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps/?q=${latidute},${longitude}`))
        callback();
    })

    //Join
    socket.on("join",({username, room},callback)=>{
        //Tracking users
        const {error, user} = addUser({
            username,
            room,
            id: socket.id
        })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        //Welcome message
        socket.emit("message", generateMessage(null, "Welcome"))

        //Sending messages to all users except the one who is emitting the event
        socket.broadcast.to(user.room).emit("message", generateMessage(null, `${user.username} has joined!`))

        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
})


server.listen(port,()=>{
    console.log("Server is up on port " + port);
})