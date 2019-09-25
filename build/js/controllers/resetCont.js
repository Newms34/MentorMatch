resetApp.controller('reset-contr',function($scope,$http,$location, $log){
    $scope.key = window.location.search.slice(5);

    $http.get('/user/resetUsr?key='+$scope.key).then(function(u){
        $log.debug('getting reset user status?',u);
        $scope.user=u.data;
    });
    $scope.doReset = function(){
        if(!$scope.user || !$scope.pwd || !$scope.pwdDup || $scope.pwdDup!=$scope.pwd ||!$scope.key){
            bulmabox.alert('Error: Missing data','Make sure you&rsquo;ve reached this page from a password reset link, and that you have entered the same password in both fields!');
        }else{
            $http.post('/user/resetPwd',{
                acct:$scope.user.user,
                pwd:$scope.pwd,
                pwdDup:$scope.pwdDup,
                key:$scope.key
            }).then(function(r){
                if(r.data=='err'){
                    bulmabox.alert('Error resetting password','There was an error resetting your password. Please contact a mod');
                }else{
                    bulmabox.alert('Password Reset','Your password was successfully reset! We\'re redirecting you to login now.',function(){
                        $scope.goLogin();
                    });
                }
            });
        }
    };
    $scope.goLogin = ()=>{
        window.location.href='../../login';
    };
});