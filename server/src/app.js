var express = require('express');
var app = express();
var http = require('http');
var socketio = require('socket.io');
var RSA = require('node-rsa');

global.config = require('./config.json');

var db = require('./middleware/db.js');

var server= http.Server(app);
var io = socketio(server);

server.listen(4321);

var userToSocket = {};
var socketToUser={};

function verifySignature(username, signature, callback){
  var user = db.query('Select PublicKey from users where Username=?', [username],function(err,results){
    if(err){
      return callback(err);
    }
    if(results.length<1){
      return callback('No Such Username');
    }
    var key = new RSA();
    key.importKey(results[0].PublicKey, 'public');
    var verified = key.verify(username, signature);
    return callback(null, verified, results[0].PublicKey);
  });
};

io.on('connection', function(socket){
  socket.on('login', function(data){
    verifySignature(data.Username, data.Signature, function(err, verified, publickey){
      if(err){
        return socket.emit('loginResponse', {Success:false, Error:err});
      }
      socketToUser[socket.id] = {Username: data.Username, PublicKey: publickey};
      userToSocket[data.Username] = socket.id;
      return socket.emit('loginResponse', {Success:verified});
    });
  });
  socket.on('register', function(data){
    db.query('Insert into users (Username, PublicKey) VALUES(?, ?);', [data.Username, data.PublicKey], function(err, result){
      if(err){
        return socket.emit('registerResponse', {Success:false, Error:err});
      }
      socketToUser[socket.id] = {Username: data.Username, PublicKey: data.PublicKey};
      userToSocket[data.Username] = socket.id;
      return socket.emit('registerResponse', {Success:true});
    });
  });
  socket.on('message', function(data){
    var recipient = userToSocket[data.To];
    io.to(recipient).emit('message', {From: socketToUser[socket], Message: data.Message})
  });
});

console.log("Server started on port 4321");
