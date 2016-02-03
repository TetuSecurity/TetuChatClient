'use strict'

var app = angular.module('Tetu', ['ngRoute']);

app.controller('PageCtrl', function ($scope, authService) {

});

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		controller: 'ChatCtrl',
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
