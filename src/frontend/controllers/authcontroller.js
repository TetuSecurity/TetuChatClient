app.controller('AuthCtrl', function ($scope, $location, authService, isLoggingIn) {
  var remote = require('electron').remote;
  var ioclient = remote.require('./sockets');
  $scope.isLoggingIn = isLoggingIn;
	$scope.auth= {};

	$scope.login=function(){
		authService.logIn($scope.auth, function(err){
      if(err){
        console.log(err);
      }
    });
	};

	$scope.register=function(){
		authService.signUp($scope.auth, function(err){
			if(err){
				console.log(err);
			}
		});
	};

	$scope.fileNameChanged = function(ele){
		var file = ele.files[0];
		$scope.auth.Keyfile = file.path;
	};

  ioclient.on('loginResponse', function(data){
    if(data.Success){
      authService.saveUser(data.Username);
      $location.path('/');
      $scope.$apply();
    }
    else{
      console.log(data.Error);
    }
  });

  ioclient.on('registerResponse', function(data){
    if(data.Success){
      authService.saveUser(data.Username);
      $location.path('/');
      $scope.$apply();
    }
    else{
      console.log(data.Error);
    }
  });

});
