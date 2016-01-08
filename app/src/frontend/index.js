'use strict'

var app = angular.module('Tetu', ['ngRoute']);

app.controller('PageCtrl', function ($scope, $http) {
	var remote = require('electron').remote;
	var ioclient = remote.require('./sockets.js');
	var rsa = remote.require('./rsa-engine')(ioclient);
	$scope.messages = [];
	$scope.chatInput={};

	$scope.haskey=function(){
		return rsa.hasKey();
	};

	$scope.sendMessage = function(){
		var enc = rsa.encrypt($scope.chatInput.Text)
		$scope.messages.push(rsa.decrypt(enc));
		$scope.chatInput = {};
	};

});

app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
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
