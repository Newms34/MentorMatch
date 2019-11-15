app.controller('mail-cont', ($scope, $http, $q, $log, userFact) => {
    $log.debug("Mailbox ctrl registered");
    $scope.outMode = false;
    $scope.mailView = {
        title: 'No Message Selected',
        htmlMsg: 'Not sure how you got here, but there is not message here!',
        mdMsg: '',
        show: false,
        toMode: false,
        date: 12345,
        other: false
    };
    $scope.viewMsg = d => {
        $log.debug('incoming msg object is', d);
        $scope.mailView.title = d.to ? `Message to ${$scope.getUserList(d.to)}` : `Message from ${d.from.displayName || d.from.user}`;
        $scope.mailView.htmlMsg = d.htmlMsg;
        $scope.mailView.isConMsg = !!d.isConMsg;
        $scope.mailView.date = d.date;
        $scope.mailView.toMode = !!d.to;
        $scope.mailView.other = d.to || d.from;
        $scope.mailView.topics = d.topics;
        $scope.mailView._id = d._id;
        $scope.mailView.msgId = d.msgId || 0;
        $scope.mailView.show = true;
        $scope.mailView.isRep = !!d.isRep;
    };
    $scope.newMsg = {
        to: [],
        htmlMsg: '',
        isReply: false,
        show: false,
    };
    $scope.reportMsg = m => {
        bulmabox.confirm('Report Message', `Are you sure you wish to report this message from ${m.other} to the moderator team?`, a => {
            if (a && a != null) {
                $http.post('/user/repMsg', m)
                    .then(r => {
                        bulmabox.alert('Reported!', 'A notification has been sent to the moderator team!');
                    });
            }
        });
    };
    $scope.startTeach = () => {
        $http.put('/user/teach', $scope.mailView).then(r => {
            //do nuffin
            $scope.mailView.show = false;
        });
    };
    $scope.explStartTeach = () => {
        bulmabox.alert('Start Teaching', `Clicking the "Teach" button will allow the student to leave reviews for you. <br>While there's nothing explicitly preventing you from connecting on your own, we'd still recommend you click this button, as well-written reviews are always helpful!`);
    };
    $scope.replyMsg = m => {
        $log.debug('attempting to setup reply to msg', m);
        $scope.newMsg.show = true;
        $scope.newMsg.to = [m.from || m.other];
        $scope.newMsg.isReply = m;
        //we also reset Mailview so that we don't have two dialogs open.
        $scope.mailView = {
            title: 'No Message Selected',
            htmlMsg: '',
            mdMsg: '',
            rawMsg: '',
            show: false,
            toMode: false,
            date: 12345,
            other: false
        };
        $log.debug('newMsg now', $scope.newMsg);
    };
    $scope.cancelSend = () => {
        if ($scope.newMsg.mdMsg && $scope.newMsg.mdMsg.length) {
            bulmabox.confirm('Discard Message', 'Are you sure you wish to discard this message?', ra => {
                if (ra && ra != null) {
                    $scope.newMsg = {
                        to: [],
                        htmlMsg: '',
                        isReply: false,
                        show: false
                    };
                    $scope.$digest();
                }
            });
        } else {
            $scope.newMsg = {
                to: [],
                htmlMsg: '',
                isReply: false,
                show: false,
            };
        }
    };
    $scope.makeNewMsg = () => {
        //new, blank msg
        $scope.newMsg.show = true;
        $scope.newMsg.to = [];
        $scope.newMsg.isReply = false;
    };
    $scope.sendMsg = () => {
        if (!$scope.newMsg.to.length || !$scope.newMsg.mdMsg || !$scope.newMsg.mdMsg.length) {
            return bulmabox.alert('Missing Information', 'Please provide at least one user and something to say!');
        }
        const conv = new showdown.Converter();
        $scope.newMsg.htmlMsg = conv.makeHtml($scope.newMsg.mdMsg);
        if (!!$scope.newMsg.isReply) {
            //concatenate the old and new msgs.
            $scope.newMsg.htmlMsg = `${$scope.newMsg.isReply.htmlMsg}<hr>${$scope.newMsg.htmlMsg}`;
            $scope.newMsg.mdMsg = `${$scope.newMsg.isReply.mdMsg}\n---\n${$scope.newMsg.mdMsg}`;
        }
        // return $log.debug('WOULD SEND:', $scope.newMsg)
        userFact.sendMsg({
            to: $scope.newMsg.to,
            htmlMsg: $scope.newMsg.htmlMsg,
            mdMsg: $scope.newMsg.mdMsg
        }).then(r => {
            $scope.newMsg = {
                to: [],
                htmlMsg: '',
                isReply: false,
                show: false,
            };
            bulmabox.alert('Message Sent!', 'Your message is on its way!');
        });
    };
    $scope.newMsgAdd = e => {
        if (!$scope.newMsg.show) {
            return false;
        }
        // $log.debug('EVENT:',e);
        if (e.key.toLowerCase() === 'enter' && !$scope.newMsg.to.includes($scope.newMsg.possUsr)) {
            $scope.newMsg.to.push($scope.newMsg.possUsr);
            $scope.newMsg.possUsr = '';
        } else if (e.key.toLowerCase() === 'enter') {
            // $log.debug('ALREADY HAZ', thisTag)
            const timerFn = function () {
                let tl = 250;
                const thisTag = document.querySelector(`.user-to-tag[data-name='${$scope.newMsg.possUsr}']`),
                    intv = setInterval(function () {
                        //for lightness: 50% to 96%
                        tl -= 10;
                        if (tl < 0) {
                            return clearInterval(intv);
                        }
                        const lite = ~~(46 * ((250 - tl) / 250)),
                            col = `hsl(0,${~~(100 * tl / 250)}%,${lite + 50}%)`;
                        thisTag.style.background = col;
                    }, 10);
            }();
            $scope.newMsg.possUsr = '';
        }
    };
    $scope.newMsgRem = u => {
        if (!$scope.newMsg.show) {
            return false;
        }
        $scope.newMsg.to = $scope.newMsg.to.filter(q => q != u);
    };
    $scope.delMsg = m => {
        bulmabox.confirm('Delete Message', `Are you sure you wish to delete this message? This is <i>not</i> reversable!`, a => {
            if (a && a != null) {
                const uri = m.from ? `/user/delMsg?msgId=${m.msgId}` : `/user/delMyMsg?msgId=${m.msgId}`;
                $http.get(uri)
                    .then(r => {
                        //do nothing; should refresh.
                    });
            }
        });
    };
    $scope.getUserList = (o) => {
        return o.map(q => q.displayName || q.user).join(', ');
    };
});