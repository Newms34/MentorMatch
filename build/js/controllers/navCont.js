app.controller('nav-cont',function($scope,$http,$state, $log){
	$scope.logout = function() {
        bulmabox.confirm('Logout','Are you sure you wish to logout?', function(resp) {
            if (!resp || resp == null) {
                return true;
            } else {
                $http.get('/user/logout').then(function(r) {
                    $log.debug('b4 logout usr removl, parent scope is',$scope.$parent.user);
                    $scope.$parent.user=null;
                    $log.debug('and now its',$scope.$parent.user);
                    $state.go('appSimp.login');
                });
            }
        });
    };
    $scope.mobActive=false;
});