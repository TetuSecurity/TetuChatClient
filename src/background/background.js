var ipc = require('electron').ipcRenderer;
var remote = require('electron').remote;
var encryption = remote.require('./encryption');

window.onload = function () {
	ipc.on('encrypt-request', function(event, envelope){
    var enc_obj = encryption.encrypt(envelope.Data);
		envelope.Data = enc_obj.Data;
    envelope.Key = encryption.RSAencrypt(enc_obj.Key, envelope.PublicKey);
		delete envelope.PublicKey;
    envelope.Signature = encryption.sign(enc_obj.Data);
    ipc.send('encrypt-response', envelope);
  });

  ipc.on('decrypt-request', function(event, envelope){
    if(encryption.verify(envelope.Data, envelope.Signature, envelope.PublicKey)){
			delete envelope.Signature;
			delete envelope.PublicKey;
      var deckey = encryption.RSAdecrypt(envelope.Key);
			delete  envelope.Key;
      envelope.Data = encryption.decrypt(envelope.Data, deckey);
      ipc.send('decrypt-response', envelope);
    }
    else{
      ipc.send('decrypt-response', {Data: 'Invalid Signature!', From:'SYSTEM MESSAGE'});
    }
  });
};
