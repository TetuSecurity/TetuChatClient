app.factory('authService', ['$q', function($q){
  var remote = require('electron').remote;
	var ioclient = remote.require('./sockets'); //replace with socket service
  var rsa = remote.require('./rsa-engine');
  var user;
  var isLoggedIn= false;

  return {
    isLoggedIn: function(){
      return isLoggedIn;
    },
    getUser:function(){
      return user || {};
    },
    hasAccess: function(){
      var deferred = $q.defer();
      if(!!isLoggedIn){
        deferred.resolve(true);
      }
      else{
        deferred.reject({authenticated: false});
      }
      return deferred.promise;
    },
    logIn: function(creds, callback){
      if(creds && creds.Username && creds.PrivateKey){
        if(rsa.loadkey(creds.PrivateKey)){
          var sig = rsa.sign(creds.Username);
          ioclient.emit('login', {Username: creds.Username, Signature: sig});
          //create timeout logic
          ioclient.on('loginResponse', function(data){
            isLoggedIn = data.Success;
            if(data.Success){
              user = {Username: data.Username};
              return callback(null, data.Success);
            }
            else{
              return callback(data.Error, false);
            }
          });
        }
        else{
          return callback('Could not load Private key', false);
        }
      }
      else{
        return callback('No Credentials provided', false);
      }
    },
    signUp: function(creds, callback){
      if(creds && creds.Username){
        if(rsa.genkey()){ //replace with call to bgWindow
          ioclient.emit('register', {Username: creds.Username, PublicKey: rsa.getPublicKey()});
          ioclient.on('registerResponse', function(data){
            if(data.Error){
              return callback(data.Error);
            }
            rsa.savePrivateKey('./'+creds.Username.trim().replace(/\s+/ig, "-")+'.pem');
            return callback(null, data.Success);
          });
        }
        else{
          return callback('Failed to generate RSA keypair');
        }
      }
      else{
        return callback('No Provided Username');
      }
    },
    logOut: function(){
      isLoggedIn = false;
    }
  };
}]);
