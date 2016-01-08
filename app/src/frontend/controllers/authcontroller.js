app.controller('AuthCtrl', function ($scope, $http, authService, isLoggingIn) {
	var remote = require('electron').remote;
	var ioclient = remote.require('./sockets.js');
	var rsa = remote.require('./rsa-engine')(ioclient);

  $scope.isLoggingIn = isLoggingIn;

	$scope.auth= {};

	$scope.login=function(){
		authService.logIn($scope.auth);
	};

	$scope.register=function(){
		authService.signUp($scope.auth);
	}

	$scope.fileNameChanged = function(ele){
		var file = ele.files[0];
		$scope.auth.privatekey = file.path;
	};

});
