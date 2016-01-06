var express = require('express');
var app = express();
var http = require('http');
var socketio = require('socket.io');
var RSA = require('node-rsa');

var server= http.Server(app);
var io = socketio(server);

server.listen(4321);

var userToSocket = {};
var socketToUser={};

function verifySignature(user, signature, callback){
  var key = new RSA();
  key.importKey(user.PublicKey, 'public');
  var verified = key.verify(user.Username, signature);
  return callback(verified);
}


io.on('connection', function(socket){
  socket.on('authResponse', function(data){
    verifySignature(data.User, data.Signature, function(verified){
      console.log('valid sign', verified);
      socket.emit('socketResponse', verified);
    });
  });
  socket.on('register', function(data){
    //save username and public key
  });
});
