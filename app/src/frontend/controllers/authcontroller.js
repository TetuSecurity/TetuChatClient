'use strict';

app.controller('AuthCtrl', function ($scope, $location, authService, isLoggingIn) {
  $scope.isLoggingIn = isLoggingIn;

	$scope.auth= {};

	$scope.login=function(){
		authService.logIn($scope.auth,function(err, res){
			if(err){
				console.log(err);
			}
			else if(res){
				$location.path('/');
				$scope.$apply();
			}
			else{
				console.log(res);
				//display error
			}
		});
	};

	$scope.register=function(){
		authService.signUp($scope.auth, function(err, res){
			if(err){
				console.log(err);
			}
			else if(res){
				$location.path('/');
				$scope.$apply();
			}
			else{
				console.log(res);
				//display error
			}
		});
	};

	$scope.fileNameChanged = function(ele){
		var file = ele.files[0];
		$scope.auth.PrivateKey = file.path;
	};

});
