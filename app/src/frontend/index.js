'use strict'

var app = angular.module('Tetu', ['ngRoute']);

app.controller('PageCtrl', function ($scope, $http) {
	var remote = require('electron').remote;
	var rsa = remote.require('./rsa-engine');
	$scope.messages = [];
	$scope.chatInput={};
	$scope.auth= {};

	$scope.generate= function(){
		rsa.generateKey($scope.auth.passphrase);
		$scope.messages.push('key generated!');
	}

	$scope.load = function(location){
		rsa.loadKey(location);
		$scope.messages.push(JSON.stringify(rsa.login('swimmadude66')));
	}

	$scope.haskey=function(){
		return rsa.hasKey();
	}

	$scope.sendMessage = function(){
		var enc = rsa.encrypt($scope.chatInput.Text)
		$scope.messages.push(enc);
		$scope.messages.push(rsa.decrypt(enc));
		$scope.chatInput = {};
	}

});

app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
	$routeProvider.when('/', {
		controller: 'PageCtrl',
		templateUrl: 'views/chat.html'
	})
/*
	.when('/login', {
		controller: 'AuthCtrl',
		templateUrl: 'views/auth.html',
		resolve:{
			isLoggingin: function(){
				return true;
			}
		}
	})
	.when('/signup', {
		controller: 'AuthCtrl',
		templateUrl: 'views/auth.html',
		resolve:{
			isLoggingin: function(){
				return false;
			}
		}
	})
*/
	.otherwise({redirectTo: '/'});
}]);

app.run(["$rootScope", "$location", function($rootScope, $location) {
  $rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
    if (eventObj.authenticated === false) {
      $location.path("/");
    }
  });
}]);
