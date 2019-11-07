app.controller('log-cont', function ($scope, $http, $state, $q, userFact, $log) {
    $scope.noWarn = false;
    $scope.nameOkay = true;
    delete localStorage.geoUsr;
    $scope.checkTimer = false;
    $scope.goReg = () => {
        $state.go('appSimp.register');
    };
    $scope.goLog = () => {
        $state.go('appSimp.login');
    };
    $scope.googLog = () => {
        window.location.href = './user/google';
    };
    $scope.forgot = () => {
        if (!$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password', 'To recieve a password reset email, please enter your username!');
            return;
        }
        $http.post('/user/forgot', { user: $scope.user }).then(function (r) {
            $log.debug('forgot route response', r);
            if (r.data == 'err') {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password Error', "It looks like that account either doesn't exist, or doesn't have an email registered with it! Contact a mod for further help.");
            } else {
                bulmabox.alert('Forgot Password', 'Check your email! If your username is registered, you should recieve an email from us with a password reset link.');
            }
        });
    };
    $scope.signin = () => {
        $log.debug('trying to login with', $scope.user, $scope.pwd);
        $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
            .then((r) => {
                $log.debug(r);
                if (r.data == 'authErr' || !r.data) {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Incorrect Login', 'Either your username or password (or both!) are incorrect.');
                } else if (r.data == 'banned') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned!");
                } else {
                    // delete r.data.msgs;
                    $log.debug('LOGIN RESPONSE', r.data);
                    socket.emit('chatMsg', { msg: `${$scope.user} logged in!` });
                    localStorage.geoUsr = JSON.stringify(r.data.usr);
                    if (r.data.news) {
                        bulmabox.alert('Updates/News', `Since you last logged in, the following updates have been implemented:<br><ul style='list-style:disc;'><li>${r.data.news.join('</li><li>')}</li></ul>`);
                    }
                    $state.go('app.dash');
                }
            })
            .catch(e => {
                if (e.data == 'banned') {
                    return bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned!");
                }
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue with your credentials. Blame the devs!");
                $log.debug(e);
            });
    };
    $scope.checkUser = () => {
        if ($scope.checkTimer) {
            clearTimeout($scope.checkTimer);
        }
        $scope.checkTimer = setTimeout(function () {
            $http.get('/user/nameOkay?name=' + $scope.user)
                .then((r) => {
                    $scope.nameOkay = r.data;
                });
        }, 500);
    };
    $scope.emailBad = false;
    $scope.checkEmail = () => {
        $scope.emailBad = $scope.email && $scope.email.length && !$scope.email.match(/(\w+\.*)+@(\w+\.)+\w+/g);
    };
    $scope.register = () => {
        if (!$scope.pwd || !$scope.pwdDup || !$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Please enter a username, and a password (twice).');
        } else if ($scope.pwd != $scope.pwdDup) {
            $log.debug('derp');
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Password Mismatch', 'Your passwords don\'t match, or are missing!');
        } else if (!$scope.email || $scope.emailBad) {
            bulmabox.confirm('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Send Without Email?', `You've either not included an email, or the format you're using doesn't seem to match any we know. <br>While you <i>can</i> register without a valid email, it'll be much more difficult to recover your account if you forget your password!<br>Register anyway?`, function (resp) {
                if (!resp || resp == null) {
                    return false;
                }
                $http.post('/user/new', {
                    user: $scope.user,
                    pass: $scope.pwd,
                    email: $scope.email
                })
                    .then((r) => {
                        $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
                            .then(() => {
                                $state.go('app.dash');
                            }).catch(e => {
                                if (e.data == 'duplicate') {
                                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                                }
                            });
                    }).catch(e => {
                        if (e.data == 'duplicate') {
                            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                        }
                    });
            });
        } else {
            $log.debug('running register with user', $scope.user, 'and pwd', $scope.pwd);
            $http.post('/user/new', {
                user: $scope.user,
                pass: $scope.pwd,
                email: $scope.email
            })
                .then((r) => {
                    $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
                        .then(() => {
                            $state.go('app.dash');
                        });
                }).catch(e => {
                    if (e.data == 'duplicate') {
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                    }
                });
        }
    };
});