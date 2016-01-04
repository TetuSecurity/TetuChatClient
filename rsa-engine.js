var encrypt = require('cryptico').RSAencrypt;
var rsa = require('node-rsa');
var fs = require('fs');

const privatekey = fs.readFileSync('./test.pem');

var key = new rsa(privatekey);

/*
Do NOT like having 2 rsa libraries. However, node-rsa does not allow encrypt without making a whole key obj.
Instead, auth/decrypt will be node-rsa; Encrypt on send will use cryptio.
*/

module.exports={
  encrypt: function (message, publickey){
    return RSAencrypt(message, publickey).cipher;
  },
  decrypt: function(enc_message){
    return key.decrypt(enc_message, 'json');
  }
};
