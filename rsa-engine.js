//const RSA = require('cryptico');
const rsa= require('node-rsa');
const fs = require('fs');


var privatekey = fs.readFileSync('./test.pem').toString();
var publickey = fs.readFileSync('./test.pub').toString();
var selfrsa = new rsa(privatekey, 'private');


module.exports={
  encrypt: function (message){
    var mkey = new rsa(); //publickey, 'public'
    mkey.importKey(publickey, 'public');
    return mkey.encrypt(message,'base64');
  },
  decrypt: function(enc_message){
    return selfrsa.decrypt(enc_message,'json');
  }
};
