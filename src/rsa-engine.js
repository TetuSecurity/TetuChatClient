const fs = require('fs');
const RSA = require('node-rsa');

var key;

module.exports={
  hasKey: function(){
    return (!!key && !key.isEmpty());
  },
  getPublicKey: function(){
    return key.exportKey('public');
  },
  getMaxMessageSize:function(){
    return key.getMaxMessageSize();
  },
  savePrivateKey: function(filepath){
    try{
      fs.writeFileSync(filepath, key.exportKey('private'));
    } catch(error){
      return false;
    }
    return true;
  },
  encrypt: function (data, publickey){
    var pkey = new RSA();
    pkey.importKey(publickey, 'public');
    var enc = pkey.encrypt(data, 'base64');
    return {Signature: key.sign(enc), Data: enc};
  },
  decrypt: function(enc_data, signature){
    var invalid_sig= key.verify(enc_data, signature);
    if(invalid_sig){
      return 'Forged Signature!';
    }
    return key.decrypt(enc_data).toString();
  },
  sign: function(data){
    return key.sign(data);
  },
  verify: function(data, signature){
    return key.verify(data, signature);
  },
  loadkey: function(keypath){
    if(!key){
      key = new RSA();
    }
    try{
      key.importKey(fs.readFileSync(keypath).toString());
    } catch(error){
      return false;
    }
    return true;
  },
  genkey: function(){
    try{
      key = new RSA({b:4096},{signingScheme: 'pss-sha512'});
    } catch(error){
      return false;
    }
    return true;
  }
};
