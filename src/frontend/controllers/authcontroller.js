app.controller('AuthCtrl', function ($scope, $location, authService, socketService, isLoggingIn) {
  var remote = require('remote');
  var dialog = remote.require('dialog');
  var ipc = require('electron').ipcRenderer;
  $scope.isLoggingIn = isLoggingIn;
	$scope.auth= {
    Server: 'https://chatserv1.tetusecurity.com:4321/'
  };
  $scope.loading = false;

	$scope.login=function(){
    if($scope.auth && /*$scope.auth.Server &&*/ $scope.auth.Username && $scope.auth.Password && $scope.auth.Keyfile){
      $scope.loading = true;
      socketService.connect($scope.auth.Server, function(err, handshake){
        if(err){
          $scope.loading = false;
          console.log('Could not connect');
          $scope.$apply();
        }
        else{
          ipc.send('login-request', JSON.parse(JSON.stringify($scope.auth)));
        }
      });
    }
    else{
      console.log('No Credentials provided');
    }
	};

	$scope.register=function(){
    if($scope.auth && $scope.auth.Server && $scope.auth.Username && $scope.auth.Password){
      $scope.loading = true;
      socketService.connect($scope.auth.Server, function(err){
        if(err){
          $scope.loading = false;
          console.log('Could not connect');
          $scope.$apply();
        }
        else{
          ipc.send('register-request', JSON.parse(JSON.stringify($scope.auth)));
        }
      });
    }
    else{
      console.log('No Provided Username');
    }
	};

	$scope.pickKey=function(){
    dialog.showOpenDialog({title: 'Load a keyfile', filters:[{name:'Keys', extensions:['KEYS']}], properties:['openFile']},function (filenames) {
      if(filenames && filenames.length>0){
        $scope.auth.Keyfile = filenames[0];
      }
    });
	};

  ipc.on('login-response', function(event, res){
    if(res.Success){
      socketService.once('loginResponse', function(data){
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
      socketService.emit('login', res.User);
    }
    else{
      $scope.loading = false;
      console.log(res.Error);
    }
  });

  ipc.on('register-response', function(event, res){
    if(res.Success){
      socketService.once('registerResponse', function(data){
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
      socketService.emit('register', res.User);
    }
    else{
      $scope.loading = false;
      console.log(err);
    }
  });

});
