'use strict';

app.factory('authService', ['$q', '$http', function($q, $http){

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
    logIn: function(creds){
      var deferred = $q.defer();
      if(creds && creds.Username && creds.Key){
        var loginSuccess = rsa.login(creds);
        isLoggedIn = loginSuccess;
        deferred.resolve(loginSuccess);
      }
      else{
        deferred.reject('No Credentials provided');
      }
      return deferred.promise;
    },
    signUp: function(creds){
      var deferred = $q.defer();
      if(creds && creds.Username){
        var loginSuccess = rsa.register(creds.Username);
        isLoggedIn = loginSuccess;
        deferred.resolve(loginSuccess);
      }
      else{
        deferred.reject('No Credentials Provided!');
      }
      return deferred.promise;
    },
    logOut: function(){
      isLoggedIn = false;
    }
  }
}]);
