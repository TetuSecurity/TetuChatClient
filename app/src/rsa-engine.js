const fs = require('fs');
const RSA = require('node-rsa');

var key;

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
      var m = pkey.encrypt(message, 'base64');
      return {Signature: key.sign(m), Message: m};
    },
    decrypt: function(enc_message){
      var invalid_sig= key.verify(enc_message.Message, enc_message.Signature);
      if(invalid_sig){
        return 'Forged Signature!';
      }
      return key.decrypt(enc_message.Message).toString();
    },
    encryptFile: function(packet, publickey){
      var pkey = new RSA();
      pkey.importKey(publickey, 'public');
      var data = pkey.encrypt(packet);
      var sig = key.sign(data);
      return {Data: data, Signature: sig};
    },
    decryptFile: function(enc_file){
      var invalid_sig= key.verify(enc_file.Data, enc_file.Signature);
      console.log(invalid_sig);
      if(invalid_sig){
        return 'Forged Signature!';
      }
      return key.decrypt(enc_file.Data);
    },
    getMaxMessageSize:function(){
      return key.getMaxMessageSize();
    },
    login: function(authdetails, callback){
      if(!key){
        key = new RSA();
      }
      var username = authdetails.Username;
      key.importKey(fs.readFileSync(authdetails.PrivateKey).toString());
      ioclient.emit('login', {Username: username, Signature: key.sign(username)});
      ioclient.on('loginResponse', function(data){
        if(data.Error){
          return callback(data.Error);
        }
        return callback(null, data.Success);
      });
    },
    register: function(username, callback){
      key = new RSA({b:4096},{signingScheme: 'pss-sha512'});
      fs.writeFileSync('./access.pem', key.exportKey());
      ioclient.emit('register', {Username: username, PublicKey: key.exportKey('public')});
      ioclient.on('registerResponse', function(data){
        if(data.Error){
          return callback(data.Error);
        }
        return callback(null, data.Success);
      });
    }
  };
  return rsaengine;
};
