app.controller('nav-cont',function($scope,$http,$state, $log){
    $scope.currState = 'dash';
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
    console.log('USER ON NAVBAR',$scope.$parent && $scope.$parent.user)
    $scope.navEls = [{
        st:'dash',
        icon:'user-circle',
        protected:false,
        text:'Profile'
    },{
        st:'match',
        icon:'users',
        protected:false,
        text:'Match'
    },{
        st:'mentor',
        icon:'graduation-cap',
        protected:false,
        text:'Mentoring'
    },{
        st:'vote',
        icon:'check-square',
        protected:false,
        text:'Voting'
    },{
        st:'mail',
        icon:'envelope',
        protected:false,
        text:'Mailbox'
    },{
        st:'mod',
        icon:'cogs',
        protected:true,
        text:'Mod Controls'
    },{
        st:'help',
        icon:'question-circle',
        protected:true,
        text:'Help'
    }]
    $scope.goState = s =>{
        $scope.currState = s;
        $state.go('app.'+s)
    }
    $scope.mobActive=false;
});

/* <a class="navbar-item has-text-white" href='#' ui-sref-active='has-background-grey-dark no-poke' ui-sref='app.dash'>
                <h3><i class="fa fa-user-circle"></i>&nbsp;Profile</h3>
            </a>
            <a class="navbar-item has-text-white" href='#' ui-sref-active='has-background-grey-dark no-poke' ui-sref='app.match'>
                <h3><i class="fa fa-users"></i>&nbsp;Match</h3>
            </a>
            <a class="navbar-item has-text-white" href='#' ui-sref-active='has-background-grey-dark no-poke' ui-sref='app.mentor'>
                    <h3><i class="fa fa-graduation-cap"></i>&nbsp;Mentoring</h3>
                </a>
            <a class="navbar-item has-text-white" href='#' ui-sref-active='has-background-grey-dark no-poke' ui-sref='app.mail'>
                <h3><i class="fa fa-envelope"></i>&nbsp;Mailbox</h3>
            </a>
            <a class="navbar-item has-text-white" href='#' ui-sref-active='has-background-grey-dark no-poke' ui-sref='app.help'>
                <h3><i class="fa fa-question-circle"></i>&nbsp;Help</h3>
            </a> */