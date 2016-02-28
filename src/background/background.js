var ipc = require('electron').ipcRenderer;
var remote = require('electron').remote;
var encryption = remote.require('./encryption');

window.onload = function () {
	ipc.on('encrypt-request', function(event, data, key, to){
    var enc_obj = encryption.encrypt(data);
    var enckey = encryption.RSAencrypt(enc_obj.Key, key);
    var sig = encryption.sign(enc_obj.Data);
    var envelope = {Data: enc_obj.Data, Key: enckey, Signature: sig, To: to};
    ipc.send('encrypt-response', envelope);
  });

  ipc.on('decrypt-request', function(event, envelope){
    if(encryption.verify(envelope.Data, envelope.Signature, envelope.PublicKey)){
      var deckey = encryption.RSAdecrypt(envelope.Key);
      var dec = encryption.decrypt(envelope.Data, deckey);
      ipc.send('decrypt-response', {Data: dec, From:envelope.From});
    }
    else{
      ipc.send('decrypt-response', {Data: 'Invalid Signature!', From:'SYSTEM MESSAGE'});
    }
  });
};
