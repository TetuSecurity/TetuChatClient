var ipc = require('electron').ipcRenderer;
var remote = require('electron').remote;
var RSA = remote.require('./rsa-engine');

window.onload = function () {
	ipc.on('encrypt-request', function(event, data, key, to){
    var enc = RSA.encrypt(data, key);
    var envelope = {Data: enc.Data, Signature: enc.Signature, To: to};
    ipc.send('encrypt-response', envelope);
  });

  ipc.on('decrypt-request', function(event, data,  signature, author){
    var dec = RSA.decrypt(data, signature);
    ipc.send('decrypt-response', {Data: dec, From:author});
  });
};
