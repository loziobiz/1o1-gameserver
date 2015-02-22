'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication', 'userSrv', 'gameSrv',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);
