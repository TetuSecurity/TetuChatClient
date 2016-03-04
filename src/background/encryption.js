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
    var aeskey = crypto.randomBytes(128).toString('hex');
    var cipher = crypto.createCipher('aes256', aeskey);
    var enc = cipher.update(data, null, 'hex');
    enc += cipher.final('hex');
    return {Key: aeskey, Data: enc};
  },
  RSAencrypt: function(data, key){
    if(!Buffer.isBuffer(data)){
      data = new Buffer(data);
    }
    return crypto.publicEncrypt(key, data);
  },
  decrypt: function(enc_data, aeskey){
    var decipher = crypto.createDecipher('aes256', aeskey);
    var dec = decipher.update(enc_data, 'hex');
    data = Buffer.concat([dec, decipher.final()]);
    return data;
  },
  RSAdecrypt: function(data){
    if(!Buffer.isBuffer(data)){
      data = new Buffer(data);
    }
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
    var hash = crypto.createHash('sha512');
    hash.update(password, 'utf8');
    var aeskey = hash.digest('hex');
    var cipher = crypto.createCipher('aes256', aeskey);
    enckeys = cipher.update(JSON.stringify(keys), 'utf8', 'hex');
    enckeys += cipher.final('hex');
    try{
      fs.writeFileSync(filepath, enckeys);
    } catch(error){
      return false;
    }
    return true;
  },
  loadkeys: function(keypath, password){
    var hash = crypto.createHash('sha512');
    hash.update(password, 'utf8');
    var aeskey = hash.digest('hex');
    try{
      var enc_keys = fs.readFileSync(keypath).toString();
      var decipher = crypto.createDecipher('aes256', aeskey);
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
