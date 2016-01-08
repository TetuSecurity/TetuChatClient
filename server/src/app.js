var express = require('express');
var app = express();
var http = require('http');
var socketio = require('socket.io');
var RSA = require('node-rsa');
var db = require('./middleware/db.js');

var server= http.Server(app);
var io = socketio(server);

server.listen(4321);

var userToSocket = {};
var socketToUser={};

function verifySignature(username, signature, callback){
  var user = db.read();
  var key = new RSA();
  key.importKey(user.PublicKey, 'public');
  var verified = key.verify(user.Username, signature);
  return callback(verified);
}


io.on('connection', function(socket){
  socket.on('login', function(data){
    verifySignature(data.Username, data.Signature, function(verified){
      socket.emit('loginResponse', verified);
    });
  });

  socket.on('register', function(data){
    db.write({ID:1, Username: data.Username, PublicKey: data.PublicKey});
  });

  socket.on('message', function(data){
    var recipient = userToSocket[data.To];
    io.to(recipient).emit('message', {From: socketToUser[socket], Message: data.Message})
  });

});
