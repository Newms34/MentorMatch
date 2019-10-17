app.controller('mentor-cont', ($scope, $http, $q, userFact, $log) => {
    $log.debug("mentor ctrl registered");
    $scope.totalStars = [0, 1, 2, 3, 4];
    $scope.messageUser = l => {
        $log.debug('sending message to', l.user);
        $http.post('/user/LCmsgStudent', l)
            .then(r => {
                bulmabox.alert('Message Sent', 'Your student {{l.user.displayName||l.user.user}} has been notified that you wish to speak with them regarding this lesson.');
            });
    };
    $scope.toggleActive = l => {
        const title = l.active ? "Deactivate Lesson" : "Re-activate Lesson",
            msg = l.active ? `Are you sure you wish to deactivate (end) this lesson?` : `Are you sure you wish to re-activate (resume) this lesson?`;
        bulmabox.confirm(title, msg, r => {
            if (!!r) {
                $http.get('/user/LCtoggleActive?id=' + l._id)
                    .then(r => {
                        //do nuffin
                    });
            }
        });
    };
    $scope.toggleHide = l => {
        const title = l.active ? "Hide Lesson" : "Un-Hide Lesson",
            msg = l.active ? `Are you sure you wish to hide this lesson?<br>Hiding a lesson will prevent it from showing up on your Teacher Review panel.` : `Are you sure you wish to un-hide this lesson? <br>Un-hiding a lesson will make it visible again on your Teacher Review panel.`;
        bulmabox.confirm(title, msg, r => {
            if (!!r) {
                $http.get('/user/LCtoggleHide?id=' + l._id)
                    .then(r => {
                        //do nuffin
                    });
            }
        });
    };
});
