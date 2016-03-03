app.factory('authService', ['$q', function($q){
  var user;
  var isLoggedIn= false;

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
    logOut: function(){
      isLoggedIn = false;
    }
  };
}]);
