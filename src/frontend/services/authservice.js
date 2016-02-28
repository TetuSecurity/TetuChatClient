app.factory('authService', ['$q', function($q){
  var remote = require('electron').remote;
	var ioclient = remote.require('./sockets'); //replace with socket service
  var encryption = remote.require('./encryption');
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
      if(creds && creds.Username && creds.Password && creds.Keyfile){
        if(encryption.loadkeys(creds.Keyfile, creds.Password)){
          var sig = encryption.sign(creds.Username);
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
          return callback('Could not load Keys', false);
        }
      }
      else{
        return callback('No Credentials provided', false);
      }
    },
    signUp: function(creds, callback){
      if(creds && creds.Username && creds.Password){
        if(encryption.genkey()){ //replace with call to bgWindow
          if(encryption.saveKeys('./'+creds.Username.trim().replace(/\s+/ig, "-")+'.keys', creds.Password)){
            ioclient.emit('register', {Username: creds.Username, PublicKey: encryption.getPublicKey()});
            ioclient.on('registerResponse', function(data){
              if(data.Error){
                return callback(data.Error);
              }
              return callback(null, data.Success);
            });
          }
          else{
            return callback('Failed to save keys');
          }
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
