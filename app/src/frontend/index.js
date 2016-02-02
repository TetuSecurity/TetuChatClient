'use strict'

var app = angular.module('Tetu', ['ngRoute']);

app.controller('PageCtrl', function ($scope, authService) {
	var remote = require('electron').remote;
	var ioclient = remote.require('./sockets.js');
	var rsa = remote.require('./rsa-engine')(ioclient);
	$scope.messages = [];
	$scope.messagePartners = {};
	$scope.focus = null;
	$scope.friends = [];
	$scope.chatInput={};
	$scope.friendSearch={};

	function getFriends(){
		ioclient.emit('getFriends', authService.getUser().Username);
		ioclient.on('getFriendsResponse', function(data){
			if(data.Error){
				console.log(data.Error);
			}
			else if(data.Success){
				$scope.friends= data.Friends;
				$scope.$apply();
			}
			else{
				console.log(data);
			}
		});
	};

	getFriends();

	$scope.sendMessage = function(){
		var enc = rsa.encrypt($scope.chatInput.Text, $scope.messagePartners[$scope.focus].PublicKey);
		$scope.messagePartners[$scope.focus].Messages.push({From: authService.getUser().Username, Message: $scope.chatInput.Text});
		ioclient.emit('message', {To:$scope.focus, Message:enc});
		$scope.chatInput = {};
	};

	$scope.openChat=function(friend){
		if(!(friend.Username in $scope.messagePartners)){
			$scope.messagePartners[friend.Username]={Username: friend.Username, Messages:[], newMessage: false};
			ioclient.emit('getKey', friend.Username);
		}
		$scope.focus = friend.Username;
	};

	ioclient.on('getKeyResponse', function(data){
		if(data.Error){
			console.log(data.Error);
		}
		else if(data.Success){
			if(data.Username in $scope.messagePartners){
				$scope.messagePartners[data.Username].PublicKey= data.Key;
			}
			$scope.$apply();
		}
		else{
			console.log(data);
		}
	});

	ioclient.on('message', function(data){
		var m = rsa.decrypt(data.Message);
		var author = data.From;
		if(!(author in $scope.messagePartners)){
			$scope.messagePartners[author] = {Username: author, Messages: [], newMessage: true};
			ioclient.emit('getKey', data.From);
		}
		$scope.messagePartners[author].Messages.push({From: data.From, Message: m});
		$scope.$apply();
	});

	ioclient.on('updatefriends', function(data){
		getFriends();
	});

});

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		controller: 'PageCtrl',
		templateUrl: 'views/chat.html',
		resolve:{
			auth: ["authService", function(authService) {return authService.hasAccess();}]
		}
	})
	.when('/login', {
		controller: 'AuthCtrl',
		templateUrl: 'views/auth.html',
		resolve:{
			isLoggingIn: function(){
				return true;
			}
		}
	})
	.when('/signup', {
		controller: 'AuthCtrl',
		templateUrl: 'views/auth.html',
		resolve:{
			isLoggingIn: function(){
				return false;
			}
		}
	})
	.otherwise({redirectTo: '/'});
}]);

app.run(["$rootScope", "$location", function($rootScope, $location) {
  $rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
    if (eventObj.authenticated === false) {
      $location.path("/login");
    }
  });
}]);
