'use strict'

const generateMessage = function(username, text){
    return {
        text,
        createdAt: new Date().getTime(),
        username
    }
}

const generateLocationMessage = function(username, url){
    return {
        url,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}