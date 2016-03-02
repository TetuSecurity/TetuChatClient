app.factory('authService', ['$q', function($q){
  var remote = require('electron').remote;
	var ioclient = remote.require('./sockets'); //replace with socket service
  var ipc = require('electron').ipcRenderer;
  var user;
  var isLoggedIn= false;

  ipc.on('login-response', function(event, res){
    if(res.Success){
      ioclient.emit('login', res.User);
    }
    else{
      console.log(res.Error);
    }
  });

  ipc.on('register-response', function(event, res){
    if(res.Success){
      ioclient.emit('register', res.User);
    }
    else{
      console.log(err);
    }
  });

  return {
    isLoggedIn: function(){
      return isLoggedIn;
    },
    getUser:function(){
      return user || {};
    },
    saveUser:function(username){
      user = {Username:username};
      isLoggedIn = !!username;
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
        ipc.send('login-request', JSON.parse(JSON.stringify(creds)));
        return callback();
      }
      else{
        return callback('No Credentials provided', false);
      }
    },
    signUp: function(creds, callback){
      if(creds && creds.Username && creds.Password){
        ipc.send('register-request', JSON.parse(JSON.stringify(creds)));
        return callback();
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
