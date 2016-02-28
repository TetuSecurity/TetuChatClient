const fs = require('fs');
const crypto = require('crypto');
var keypair;
var keys;

module.exports={
  hasKey: function(){
    return (keys && keys.private.length>0);
  },
  getPublicKey: function(){
    return keys.public;
  },
  encrypt: function (data){
    var aeskey = crypto.randomBytes(256).toString('hex');
    var cipher = crypto.createCipher('aes256', aeskey);
    var enc = cipher.update(data);
    enc += cipher.final('hex');
    return {Key: aeskey, Data: enc};
  },
  RSAencrypt: function(data, key){
    return crypto.publicEncrypt(key, data);
  },
  decrypt: function(enc_data, aeskey){
    var decipher = crypto.createDecipher('aes256', aeskey);
    var dec = decipher.update(enc_data, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  },
  RSAdecrypt: function(data){
    return crypto.privateDecrypt(keys.private, data);
  },
  sign: function(data){
    var sign = crypto.createSign('RSA-SHA512');
    sign.update(data);
    return sign.sign(keys.private, 'hex');
  },
  verify: function(data, signature, publickey){
    var verify = crypto.createVerify('RSA-SHA512');
    verify.update(data);
    return verify.verify(publickey, signature, 'hex');
  },
  saveKeys: function(filepath, password){
    try{
      var cipher = crypto.createCipher('aes256', password);
      enckeys = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
      enckeys += cipher.final('hex');
      fs.writeFileSync(filepath, enckeys);
    } catch(error){
      return false;
    }
    return true;
  },
  loadkeys: function(keypath, password){
    try{
      var enc_keys = fs.readFileSync(keypath).toString();
      var decipher = crypto.createDecipher('aes256', password);
      var kobj = decipher.update(enc_keys,  'hex', 'utf8');
      kobj += decipher.final('utf8');
      keys = JSON.parse(kobj);
    } catch(error){
      return false;
    }
    return true;
  },
  genkey: function(){
    try{
      if(!keypair){
        keypair = require('keypair');
      }
      keys = keypair({bits:4096});
    } catch(error){
      return false;
    }
    return true;
  }
};
