'use strict'

const socket = io();

const messageForm = document.querySelector(".message-form");
const shareLocationBtn = document.querySelector(".share-location")
const messageBtn = document.querySelector(".message-send-button")
const messageInput = messageForm.querySelector("input");
const messageContainer = document.querySelector(".container")
const sidebar = document.querySelector(".chat__sidebar")

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//options
const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const autoScroll = function(){
    //New message
    const newMessage = messageContainer.lastElementChild

    //height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = messageContainer.offsetHeight
    console.log(visibleHeight);
    //height of messages container
    const containerHeight = messageContainer.scrollHeight
    console.log(containerHeight);
    //how far have I scrolled
    const scrollOffset = messageContainer.scrollTop + visibleHeight
    console.log(scrollOffset);
    console.log(containerHeight - newMessageHeight, scrollOffset);
    if(containerHeight - 2 * newMessageHeight <= scrollOffset){
        messageContainer.scrollTop = messageContainer.scrollHeight
    }
}


socket.on("message", (message)=>{
    if(!message.username) message.username = "Server"
    
    const html = Mustache.render(messageTemplate,{
        message: message.text,
        createdAt: moment(message.createdAt).format("HH-mm"),
        username: message.username
    })
    messageContainer.insertAdjacentHTML("beforeend", html)
    autoScroll()
})

socket.on("locationMessage",(locationMessage)=>{
    const html = Mustache.render(locationTemplate,{
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format("HH-mm"),
        username: locationMessage.username
    })
    messageContainer.insertAdjacentHTML("beforeend", html)
})

messageForm.addEventListener("submit",(e)=>{
    e.preventDefault()

    //disable the form
    messageBtn.setAttribute("disabled","disabled")


    const message = e.target.elements.message.value

    socket.emit("sendMessage", message, (error)=>{
        //enable form 
        messageBtn.removeAttribute("disabled")
        messageInput.value = ""
        messageInput.focus()
        
        if(error){
            return console.log(error);
        }

        console.log("Message delivered");
    })
})

shareLocationBtn.addEventListener("click", ()=>{
    //disable btn
    shareLocationBtn.setAttribute("disabled", "disabled");


    if(!navigator.geolocation){
        shareLocationBtn.removeAttribute("disabled")

        return alert("Your browser doesn't support sharing geolocation")
    }
    navigator.geolocation.getCurrentPosition((geolocation)=>{
        socket.emit("sendLocation",geolocation.coords.latitude,geolocation.coords.longitude,()=>{
            console.log("Location shared!!!!");
            shareLocationBtn.removeAttribute("disabled")
        })
    },()=>{
        alert("Could not get your position")
    })
})

socket.on("roomData",({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    
    sidebar.innerHTML = html
})
socket.emit("join",{
    username,
    room 
}, (error)=>{
    if(!error) return;

    alert(error)
    location.href = '/'
})
