const fs = require('fs');
const RSA = require('node-rsa');

var key = undefined;

module.exports={
  generateKey: function(callback){
    key = new RSA({b:4096},{signingScheme: 'pss-sha512'});
    fs.writeFileSync('./access.pem', key.exportKey());
    return callback();
  },
  loadKey: function(){
    key = new RSA();
    key.importKey(fs.readFileSync('./access.pem').toString());
  },
  hasKey: function(){
    return (!!key && !key.isEmpty());
  },
  getPublicKey: function(){
    return key.exportKey('public');
  },
  encrypt: function (message){
    //var pkey = new RSA();
    //pkey.importKey(fs.readFileSync('./access.pub').toString(), 'public');
    return key.encrypt(message, 'base64');
  },
  decrypt: function(enc_message){
    return key.decrypt(enc_message).toString();
  },
  login: function(username){
    const socketclient = require('socket.io-client')('http://localhost:4321');
    socketclient.emit('authResponse', {User: {Username: username, PublicKey: key.exportKey('public')}, Signature: key.sign(username)});
    socketclient.on('socketResponse', function(verified){
      return verified;
    });
  }
};
