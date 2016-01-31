'use strict'

var app = angular.module('Tetu', ['ngRoute']);

app.controller('PageCtrl', function ($scope, authService) {
	var remote = require('electron').remote;
	var ioclient = remote.require('./sockets.js');
	var rsa = remote.require('./rsa-engine')(ioclient);
	$scope.messages = [];
	$scope.messagePartner = null;
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
				$scope.friends=[];
				for(var i=0; i< data.Friends.length; i++){
					$scope.friends.push({Username: data.Friends[i].Username});
				}
				console.log($scope.friends);
			}
			else{
				console.log(data);
			}
		});
	};

	getFriends();

	$scope.sendMessage = function(){
		var enc = rsa.encrypt($scope.chatInput.Text, $scope.messagePartner.PublicKey);
		$scope.messages.push($scope.chatInput.Text);
		ioclient.emit('message', {To:$scope.messagePartner.Username, Message:enc});
		$scope.chatInput = {};
	};

	$scope.openChat=function(){
		var friend = $scope.friendSearch;
		ioclient.emit('getKey', friend.Username);
		ioclient.on('getKeyResponse', function(data){
			if(data.Error){
				console.log(data.Error);
			}
			else if(data.Success){
				console.log(data);
				$scope.messagePartner = {Username: friend.Username, PublicKey: data.Key};
			}
			else{
				console.log(data);
			}
		});
	};

	ioclient.on('message', function(data){
		var m = rsa.decrypt(data.Message);
		$scope.messages.push(m);
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
