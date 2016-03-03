var ipc = require('electron').ipcRenderer;
var encryption = require('./encryption');

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

	ipc.on('login-request', function(event, creds){
		if(encryption.loadkeys(creds.Keyfile, creds.Password)){
			var sig = encryption.sign(creds.Username);
			ipc.send('login-response', {Success: true, User: {Username:creds.Username, Signature:sig}});
		}
		else{
			ipc.send('login-response', {Success: false, Error: 'Could not load Keys'});
		}
	});

	ipc.on('register-request', function(event, creds){
		if(encryption.genkey()){
			if(encryption.saveKeys('./'+creds.Username.trim().replace(/\s+/ig, "-")+'.keys', creds.Password)){
				ipc.send('register-response', {Success:true, User:{Username:creds.Username, PublicKey: encryption.getPublicKey()}});
			}
			else{
				ipc.send('register-response', {Success:false, Error:'Failed to save keys'});
			}
		}
		else{
			ipc.send('register-response', {Success:false, Error:'Failed to generate RSA keypair'});
		}
	});

};
