'use strict';

app.factory('authService', ['$q', function($q){

  var remote = require('electron').remote;
	var ioclient = remote.require('./sockets.js');
	var rsa = remote.require('./rsa-engine')(ioclient);

  var isLoggedIn= false;

  return {
    isLoggedIn: function(){
      return isLoggedIn;
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
      if(creds && creds.username && creds.privatekey){
        rsa.login(creds, function(err, success){
          isLoggedIn = success;
          if(err){
            return callback(err);
          }
          else{
            return callback(null, success);
          }
        });
      }
      else{
        return callback('No Credentials provided');
      }
    },
    signUp: function(creds, callback){
      if(creds && creds.username){
        rsa.register(creds.username, function(err, success){
          isLoggedIn = success;
          if(err){
            return callback(err);
          }
          else{
            return callback(null, success);
          }
        });
      }
      else{
        return callback('No Provided Username');
      }
    },
    logOut: function(){
      isLoggedIn = false;
    }
  }
}]);
