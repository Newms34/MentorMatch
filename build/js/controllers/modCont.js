app.controller('mod-cont', function ($scope, $http, $state, $log, userFact) {
    setInterval(function () {
        if ((!$scope.$parent || !$scope.$parent.user || !$scope.$parent.user.mod) && $state.current.name == 'app.mod') {
            console.log('User not mod');
            $state.go('app.dash');
        }
    }, 1);
    console.log('current state', $state.current);
    $scope.getAllUsers = () => {
        $http.get('/user/users').then(us => {
            // console.log('ALL USERS IS',us)
            $scope.allUsrs = us && us.data;
        }).catch(e => {
            if (e.data && e.data == 'noUsrs') {
                return bulmabox.alert('No Users!', `Something's gone wrong, and we can't find any users.`);
            }
        });
    };
    $scope.getAllUsers();
    $scope.toggleBan = u => {
        //toggle ban for a user
        if (u.user === $scope.$parent.user.user) {
            return bulmabox.alert(`Cannot Ban Self`, `You can't ban yourself!`);
        }
        const t = u.isBanned ? 'Unban User' : 'Ban User',
            m = u.isBanned ? `Are you sure you wish to unban ${u.displayName || u.user}? This will restore their access to CodeMentorMatch.` : `Are you sure you wish to ban ${u.displayName || u.user}? This will revoke their access to CodeMentorMatch.`;
        bulmabox.alert(t, m, r => {
            if (!!r) {
                $http.put('/user/toggleBan', {
                    user: u.user,
                })
                    .then(r => {
                        $scope.getAllUsers();
                    });
            }
        });
    };
    $scope.showMsgDial = u => {
        $scope.newMsg = {
            user: u.user,
            displayName: u.displayName,
            msg: null,
            show: true
        };
    };
    $scope.cancelMsg = () => {
        $scope.newMsg = {
            user: null,
            displayName: null,
            msg: null,
            show: false
        };
    };
    $scope.newMsg = {
        user: null,
        displayName: null,
        mdMsg: null,
        show: false
    };
    $scope.sendMsg = () => {
        if (!$scope.newMsg.mdMsg || $scope.newMsg.mdMsg.trim().length) {
            return bulmabox.alert('No Message', `Please enter a message to send!`);
        }
        const conv = new showdown.Converter();
        $scope.newMsg.htmlMsg = conv.makeHtml($scope.newMsg.mdMsg);
        userFact.sendMsg($scope.newMsg)
            .then(r => {
                bulmabox.alert('Message Sent!', `Your message is on its way!`);
            });
    };
});