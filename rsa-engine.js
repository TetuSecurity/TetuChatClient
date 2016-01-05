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
    key.importKey(fs.readFileSync('./access.key').toString());
  },
  hasKey: function(){
    return (!!key && !key.isEmpty());
  },
  getPublicKey: function(){
    return key.exportKey('public');
  },
  encrypt: function (message){
    var pkey = new RSA();
    pkey.importKey(fs.readFileSync('./access.pub').toString(), 'public');
    return pkey.encrypt(message, 'base64');
  },
  decrypt: function(enc_message){
    return key.decrypt(enc_message).toString();
  }
};


/*
Cryptico

const RSA = require('cryptico');

(function(c){
    var parametersBigint = ["n", "d", "p", "q", "dmp1", "dmq1", "coeff"];

    c.privateKeyString = function(rsakey) {
      return JSON.stringify({
          coeff: rsakey.coeff.toString(16),
          d: rsakey.d.toString(16),
          dmp1: rsakey.dmp1.toString(16),
          dmq1: rsakey.dmq1.toString(16),
          e: rsakey.e.toString(16),
          n: rsakey.n.toString(16),
          p: rsakey.p.toString(16),
          q: rsakey.q.toString(16),
      });
    }
    c.RSAParse = function(rsaString) {
      var json = JSON.parse(rsaString);
      var rsa = new c.RSAKey();
      rsa.setPrivateEx(json.n, json.e, json.d, json.p, json.q, json.dmp1, json.dmq1, json.coeff);
      return rsa;
    }
})(RSA);

var key = undefined;

module.exports={
  generateKey: function(passphrase){
    key = RSA.generateRSAKey(passphrase, 2048);
    var keyjson = RSA.privateKeyString(key);
    fs.writeFileSync('./access.key', keyjson);
  },
  saveKey: function(){
    if(key){
      var keyjson = RSA.privateKeyString(key);
      fs.writeFileSync('./access.key', keyjson);
    }
  },
  loadKey: function(){
    key = RSA.RSAParse(fs.readFileSync('./access.key').toString());
  },
  hasKey: function(){
    return !!key;
  },
  getPublicKey: function(){
    return RSA.publicKeyString(key) || undefined;
  },
  encrypt: function (message){
    return RSA.encrypt(message, RSA.publicKeyString(key), key).cipher;
  },
  decrypt: function(enc_message){
    return RSA.decrypt(enc_message, key).plaintext;
  }
};
*/
