app.controller('AuthCtrl', function ($scope, $location, authService, isLoggingIn) {
  var remote = require('electron').remote;
  var ipc = require('electron').ipcRenderer;
  var ioclient = remote.require('./sockets'); //replace with socket service
  $scope.isLoggingIn = isLoggingIn;
	$scope.auth= {};
  $scope.loading = false;

	$scope.login=function(){
    if($scope.auth && $scope.auth.Username && $scope.auth.Password && $scope.auth.Keyfile){
      $scope.loading = true;
      ipc.send('login-request', JSON.parse(JSON.stringify($scope.auth)));
    }
    else{
      console.log('No Credentials provided');
    }
	};

	$scope.register=function(){
    if($scope.auth && $scope.auth.Username && $scope.auth.Password){
      $scope.loading = true;
      ipc.send('register-request', JSON.parse(JSON.stringify($scope.auth)));
      console.log('registration job sent');
    }
    else{
      console.log('No Provided Username');
    }
	};

	$scope.fileNameChanged = function(ele){
		var file = ele.files[0];
		$scope.auth.Keyfile = file.path;
	};

  ipc.on('login-response', function(event, res){
    if(res.Success){
      ioclient.emit('login', res.User);
    }
    else{
      $scope.loading = false;
      console.log(res.Error);
    }
  });

  ipc.on('register-response', function(event, res){
    console.log('key generated');
    if(res.Success){
      ioclient.emit('register', res.User);
    }
    else{
      $scope.loading = false;
      console.log(err);
    }
  });

  ioclient.on('loginResponse', function(data){
    $scope.loading = false;
    if(data.Success){
      authService.saveUser(data.Username);
      $location.path('/');
    }
    else{
      console.log(data.Error);
    }
    $scope.$apply();
  });

  ioclient.on('registerResponse', function(data){
    $scope.loading = false;
    if(data.Success){
      authService.saveUser(data.Username);
      $location.path('/');
    }
    else{
      console.log(data.Error);
    }
    $scope.$apply();
  });

});
