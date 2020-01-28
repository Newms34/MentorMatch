
app.controller('match-cont', function ($scope, $http, $q, $log) {
    $log.debug("matcher ctrl registered");
    $scope.regetTopics = () => {
        $http.get('/topic/topic').then(r => {
            $scope.topicObjsAll = r.data.map(q => {
                return { value: q.title.toLowerCase(), display: q.title, desc: q.desc };
            });
            $scope.topicObjs = angular.copy($scope.topicObjsAll);
            $scope.topicObjs.push({ value: 'addSkill', display: '---- + Add a skill ----', desc: 'Add a new skill!' });
        });
    };
    socket.on('topicRef', function (o) {
        bulmabox.confirm('Topic Refresh', `One or more topics have been update. Would you like to refresh the page to make these new topics available?`, r => {
            if (!!r) {
                return window.location.reload(true);
            }
        });
    });
    $scope.regetTopics();
    $scope.clearSearch = ()=>{
        $scope.skillSearch='';
        $scope.showNSR = false;
        $scope.$digest();
    };
    $scope.showNSR = false;
    // $scope.nsr = document.querySelector('#no_result')
    $scope.pickedItem = null;
    $scope.newTopic = {
        title: null,
        desc: null,
        show: false
    };
    $scope.toggleNewTopicDia = () => {
        document.dispatchEvent(new Event('click'));
        $scope.newTopic.title = !$scope.newTopic.show ? $scope.topicToAdd : null;
        const nfCtrl = document.querySelector('.md-standard-list-container.md-autocomplete-suggestions-container');
        if (!$scope.newTopic.show) {
            nfCtrl.className += ' ng-hide';
        } else {
            // nfCtrl.className = nfCtrl.className.replace(' ng-hide','')
        }
        $scope.newTopic.show = !$scope.newTopic.show;
        if (!$scope.newTopic.show && waitingForTopic) {
            waitingForTopic = false;
            $scope.regetTopics();
        }
    };
    let waitingForTopic = false;
    socket.on('topicUpdate', u => {
        if (!!$scope.newTopic.show) {
            //if the topic adding window is currently showing, don't refresh; wait for user to submit new topic;
            waitingForTopic = true;
        } else {
            $scope.regetTopics();
        }
    });
    $scope.pickedTopics = [];
    // $scope.addTopicBtn = () => {
    //     return 'Nothing to see here!'
    // };
    $scope.changeTopList = () => {
        // $log.debug('simpTops', tl, 'all', $scope.topicObjsAll)
        const tl = $scope.pickedTopics.map(s => s.title.toLowerCase());
        //remove this from our list of available topics to add
        $log.debug('TOPICS',$scope.pickedTopics,tl);
        $scope.topicObjs = $scope.topicObjsAll.filter(tf => !tl.includes(tf.value));
        $http.post('/user/topicSearch', $scope.pickedTopics).then(r => {
            $scope.availTeachs = r.data;
            // $log.debug('TEACHERS',$scope.availTeachs)
        });
    };
    $scope.addSearchTopic = (q) => {
        //add a topic to search by!
        $log.debug('topic', q);
        if ($scope.pickedTopics.map(a => a.title.toLowerCase()).includes(q.title)) {
            // $log.debug('Duplicate!',q)
            $scope.topicToAdd = '';
            return bulmabox.alert(`Already Added`, `You've already added this topic!`);
        }
        const topicPush = angular.copy(q);
        topicPush.min = 1;
        $scope.pickedTopics.push(topicPush);
        $scope.changeTopList();
        // $scope.filterMe('')
        // $scope.topicObjs = $scope.topicObjsAll.filter(q => !.includes(q));
        $log.debug('OPTS NOW',document.querySelector('#skill-box').options);
        Array.from(document.querySelector('#skill-box').options).forEach((q,i)=>{q.selected==!i;});
        // $scope.selectedTopic ='';
        document.querySelector('#skill-box').selectedIndex=0;
    };  
    $scope.removeTopic = t => {
        $scope.pickedTopics = $scope.pickedTopics.filter(q => q.title != t.title);
        $scope.changeTopList();
    };
    $scope.mentCon = {
        topics: [],
        user: null,
        show: false,
        tz: { from: null, to: null, offset: new Date().getTimezoneOffset() },
        plusMdMsg: null,
        plusHtmlMsg: null,
    };
    $scope.times = new Array(24).fill(1).map((q, i) => {
        let tl = null;
        if (i < 12) {
            tl = (i + 1) + ':00 AM';
        } else {
            tl = (i - 11) + ':00 PM';
        }
        return {
            label: tl,
            num: i
        };
    });
    // $scope.lvls = ['None', 2, 3, 4, 5, 6, 7, 8, 9, 10];
    $scope.lvls = new Array(10).fill(1).map((q, i) => ({ lbl: i > 1 ? i : 'None', num: i }));
    $scope.conv = new showdown.Converter();
    $scope.doConnect = u => {
        //set up the dialog box for connecting w/ mentor
        $scope.mentCon.user = u.user;
        $scope.mentCon.displayName = u.displayName || null;
        $scope.mentCon.topics = $scope.pickedTopics.map(s => s.value);
        $scope.mentCon.plusMdMsg = null;
        $scope.mentCon.plusHtmlMsg = null;
        $scope.mentCon.tz = { from: null, to: null };
        $scope.mentCon.show = true;
        $scope.mentCon.topics = $scope.pickedTopics.map(q => q.display);
        // $log.debug('original incoming object to doConnect was',u)
        // $scope.$apply();
    };
    $scope.sendConnectMsg = t => {
        // $log.debug('would send', $scope.mentCon)
        $scope.mentCon.plusHtmlMsg = $scope.conv.makeHtml($scope.mentCon.plusMdMsg);
        // return false;
        $http.put('/user/connect', $scope.mentCon).then(r => {
            $scope.mentCon.show = false;
            bulmabox.alert('Connect Request Sent', `User ${$scope.mentCon.displayName || $scope.mentCon.user} has been notified that you'd like them as a mentor!`);
        });
    };
    //lesson request stuff
    $scope.reqLess = () => {
        $log.debug('User', $scope.$parent.user, 'wants lesosn on topics', $scope.pickedTopics);
        //now we need to prepare an object to send to our lessonReq model
        const lro = $scope.pickedTopics.map(q => q.display);
        $log.debug('Final LRO:', lro);
        $http.post('/user/lessonReq', lro).then(r => {
            bulmabox.alert('Lesson Request Sent', `Your lesson request has been sent! You can head on over to the "View Requested Lessons" tab if you wanna view or delete it.`);
        }).catch(e => {
            bulmabox.alert("Duplicate Lesson Request", `You've already requested a lesson for these skills!`);
        });
    };
    $scope.answerRl = (rl) => {
        const topicList = rl.topics.map(q => {
            const topicOnTeacher = $scope.$parent.user.interests.find(a => a.title == q.title);
            if (!topicOnTeacher) {
                //teacher does not have this topic
                return `<li>${q.title}  <div class='tag is-warning' title='This skill is not in your list of personally known skills!'><div class='fa fa-exclamation-triangle'></div></div></li>`;
            } else if (topicOnTeacher.lvl <= q.lvl) {
                //teacher's experience is equal to or less than student's
                return `<li>${q.title}  <div class='tag is-danger' title='Your level in this skill is less than or equal to the student's level!'><div class='fa fa-exclamation-triangle'></div></div></li>`;
            } else {
                return `<li>${q.title}</li>`;
            }
        }).join('');
        bulmabox.confirm('Teach Lesson', `Are you sure you wish to teach a lesson on the following topics?
        <ul class="contents">
        ${topicList}
        </ul>`, r => {
            if (!!r && r != null) {
                $http.post('/user/teachLessonReq', {
                    id: rl._id
                }).then(r => {
                    bulmabox.alert('Teach Offer Sent', `This student has been notified that you wish to teach this lesson. You'll be notified when they respond to your request.`);
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.noAnswerRl = o => {
        bulmabox.confirm("Cancel Teaching Offer", `Are you sure you wish to rescind your offer to teach these skills to ${o.displayName || o.user}?`, r => {
            if (!!r && r != null) {
                $http.post('/user/teachLessonReq', {
                    id: o._id
                }).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.deleteRl = (o) => {
        $log.debug('WANNA DELETE LESSON', o);
        bulmabox.confirm('Delete Lesson Request', `Are you sure you wish to delete this lesson request?<br/>You'll need to make a new one if you wanna learn these skills!`, r => {
            if (!!r && r != null) {
                $http.delete('/user/lessonReq?id=' + o._id).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.acceptMentor = (tchr, lsn) => {
        bulmabox.confirm('Accept Mentor', `Are you sure you wish to accept this mentor? This will remove the lesson from the list of Requested Lessons and send a message to both of you to connect.`, r => {
            if (!!r && r != null) {
                $http.post('/user/acceptLesson', { id: lsn._id, teacher: tchr }).then(r => {
                    $scope.regetReqLsns();
                });
            }
        });
    };
    $scope.regetReqLsns = () => {
        $http.get('/user/lessonReq').then(r => {
            $scope.requestedLessons = r.data;
        });
    };
    $scope.tchrInfo = {
        teacher: null,
        show: false
    };
    $scope.showTchrInfo = t => {
        // $log.debug("Would show teacher info for ",t)
        $scope.tchrInfo.tchr = t;
        $scope.tchrInfo.show = true;
    };
    $scope.totalStars = [0, 1, 2, 3, 4];
    socket.on('refReqLs', o => {
        $scope.regetReqLsns();
    });
});