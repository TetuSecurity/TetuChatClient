const fs = require('fs');
const RSA = require('node-rsa');

var key = undefined;

module.exports=function(ioclient){

  var rsaengine = {
    hasKey: function(){
      return (!!key && !key.isEmpty());
    },
    getPublicKey: function(){
      return key.exportKey('public');
    },
    encrypt: function (message, publickey){
      var pkey = new RSA();
      pkey.importKey(publickey, 'public');
      var message = pkey.encrypt(message, 'base64');
      return {Signature: key.sign(message), Message: message};
    },
    decrypt: function(enc_message, publickey){
      var pkey = new RSA();
      pkey.importKey(publickey, 'public');
      var valid_sig= pkey.verify(enc_message.Message, enc_message.Signature);
      if(valid_sig){
        return 'Forged Signature!';
      }
      return key.decrypt(enc_message.Message).toString();
    },
    login: function(authdetails){
      if(!key){
        key = new RSA();
      }
      var username = authdetails.username;
      key.importKey(fs.readFileSync(authdetails.privatekey).toString());
      ioclient.emit('login', {Username: username, Signature: key.sign(username)});
      ioclient.on('loginResponse', function(verified){
        return verified;
      });
    },
    register: function(username){
      key = new RSA({b:4096},{signingScheme: 'pss-sha512'});
      fs.writeFileSync('./access.pem', key.exportKey());
      ioclient.emit('register', {Username: username, PublicKey: key.exportKey('public')});
      ioclient.on('registerResponse', function(data){
        return data;
      });
    }
  };

  return rsaengine;
};
