app.controller('dash-cont', ($scope, $http, $q, userFact) => {
    // console.log("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.updateTopics = () => {
        // console.log('Would updoot topics here! Val we passed was',e)
        return $http.put('/user/interests', $scope.$parent.user.interests)
    }
    $scope.removeSkill = skt => {
        // console.log('USER WISHES TO REMOVE',skt)
        $http.delete('/user/interests?t=' + skt).then(r => {
            //do nothing 
        })
    }
    $scope.debounceTimer = null;
    $scope.saveDebounce = (q) => {
        if (!!$scope.debounceTimer) {
            clearTimeout($scope.debounceTimer);
        }
        $scope.debounceTimer = setTimeout(function () {
            $scope.saveGeneral();
        }, 500)
    }
    $scope.saveGeneral = () => {
        //general save thing for pretty much everything BUT topics
        const dispName = $scope.user.displayName;
        $http.post('/user/changeOther', $scope.user).catch(r => {
            //do nuffin
            if (r.data == 'dupDisplay') {
                bulmabox.alert('Duplicate Name', `Sorry, but the name ${dispName} is already in use. Please use another name.`);
                $scope.$parent.refUsr();
            }
        })
    }
    //avy stuff
    $scope.loadFile = (o) => {
        console.log('loadFile sez', o)
        $scope.loadingFile = true;
        const fr = new FileReader();
    };
    $scope.loadingFile = false;
    $scope.fileName = null;
    $scope.topicToAdd = '';
    $scope.needsResize = 200;//the max pic width
    $scope.saveDataURI = (d) => {
        // console.log('trying to update datauri to',d)
        $scope.user.avatar = d;
        $scope.saveGeneral();
    };

    $scope.filterMe = (query) => {
        const lowercaseQuery = query.toLowerCase();
        // console.log('picked topics map', $scope.pickedTopics.map(q => q.value))
        if (!$scope.topicObjs) {
            return []
        }
        let tops = $scope.topicObjs.filter(topic => {
            return (topic.value.indexOf(lowercaseQuery) > -1);
        });
        // console.log('tops', tops)
        return tops;
    }
    $scope.hazTopic = t => {
        // does this topic already exist?
        return $scope.topicObjsAll && $scope.topicObjsAll.length && t && $scope.topicObjsAll.find(q => q.display == t);
    }
    $scope.newTopic = {
        title: null,
        desc: null,
        show: false
    }
    $scope.refTopObjs = (cb) => {
        $http.get('/topic/topic').then(r => {
            $scope.topicObjsAll = r.data.map(q => {
                return { value: q.title.toLowerCase(), display: q.title, desc: q.desc }
            })
            console.log('All Topic Objs now:', $scope.topicObjsAll)
            $scope.topicObjs = angular.copy($scope.topicObjsAll);
            if (cb) {
                cb();
            }
        })
    }
    $scope.refTopObjs();
    $scope.toggleNewTopicDia = () => {
        if (!$scope.newTopic.show) {
            $scope.newTopic.title = $scope.topicToAdd;
            const menuShow = document.querySelector('.md-menu-showing'),
                mdVirt = document.querySelector('md-virtual-repeat-container');
            if (menuShow) {
                menuShow.classList.remove('md-menu-showing');
            }
            if (mdVirt) {
                mdVirt.classList.add('ng-hide');
            }

        }
        $scope.newTopic.show = !$scope.newTopic.show;
    }
    $scope.addNewTopic = () => {
        $http.post('/topic/topic', $scope.newTopic)
            .then(r => {
                //do nothing. We refresh in the socket response, just so EVERYONE can no we added a topic.
                socket.emit()
                $scope.toggleNewTopicDia();
            })
            .catch(e => {
                if (e.data == 'duplicate') {
                    bulmabox.alert('Duplicate Topic', `Hey! That topic already exists!`);
                }
            })
    }
    //add skill
    $scope.addInt = {
        title: null,
        show: false,
        lvl: 0,
        newDesc: null,
        canTeach: false,
    }
    $scope.addIntDial = (t) => {
        $scope.addInt = {
            title: t || null,
            show: true,
            lvl: 0,
            newDesc: null,
            canTeach: false,
        }
    }
    let alreadyAdded = false;
    $scope.saveSkills = () => {
        if (!$scope.topicToAdd) {
            return bulmabox.alert('No Skill Name', `Please enter a skill name!`)
        }
        const skList = $scope.$parent.user.interests;
        // console.log($scope.selectedTopic,$scope.topicToAdd);
        if (!!skList.find(q => q.title == $scope.topicToAdd)) {
            $scope.topicToAdd = '';
            return bulmabox.alert('Duplicate Skill', "You've already added that skill!");
        } else if (!$scope.hazTopic($scope.topicToAdd)) {
            // return console.log('USER TRYIN TO ADD NEW TOPIC LIKE A PLEB',$scope.topicToAdd,$scope.addInt.newDesc)
            if (alreadyAdded) {
                return console.error('O SHIT')
            }
            alreadyAdded = true;
            $http.post('/topic/topic', { title: $scope.topicToAdd, desc: $scope.addInt.newDesc }).then(r => {
                $scope.refTopObjs($scope.saveSkills);
            })
        } else {
            skList.push({
                title: $scope.topicToAdd,
                lvl: $scope.addInt.lvl,
                canTeach: !!$scope.addInt.canTeach
            });
            $scope.topicToAdd = '';
            $http.put('/user/interests', skList)
                .then(r => {
                    //do nothing
                    $scope.addInt = {
                        title: null,
                        show: false,
                        lvl: 0,
                        canTeach: false,
                    }
                });
        }
    }
    //add/edit proj
    $scope.modProj = {
        show: false,
        proj: null,
        editMode: false
    }
    $scope.modProjDial = (oldP) => {
        if (!oldP) {
            oldP = { name: null, description: null, position: null };
            // $scope.$parent.user.projects.push(oldP)
            $scope.modProj.editMode = false;
        } else {
            $scope.modProj.editMode = true;
        }
        $scope.modProj.proj = oldP;
        $scope.modProj.show = true;
    }
    $scope.saveProjs = (t) => {
        const projArr = angular.copy($scope.$parent.user.projects);
        console.log('Saving projects. List is', projArr, 'modProj', $scope.modProj)
        if (!$scope.modProj.editMode) {
            projArr.push(angular.copy($scope.modProj.proj));
        }
        const dupName = countDups(projArr, 'name');
        if (!!dupName) {
            return bulmabox.alert('Duplicate Project Name', `The name ${dupName} is already being used! Please pick another one for this project.`)
        }
        $http.put('/user/projs', projArr)
            .then(r => {
                //do nothing
                $scope.modProj = {
                    show: false,
                    proj: null,
                    editMode: false
                }
            })
    }
    $scope.deleteProj = (t) => {
        bulmabox.confirm('Remove Project', `Are you sure you wish to remove the project ${t}?`, r => {
            if (!!r) {
                $http.delete('/user/projs', { name: t })
                    .then(r => {

                    })
            }
        })
    }
    //curr lesson stuffs
    $scope.countDups = countDups;
    $scope.messageTeacher = l => {
        bulmabox.confirm('Message Mentor', "Do you wish to send a message to this mentor that you wish to discuss the lesson?", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/user/reqDiscussLesson?id=', l)
                .then(r => {
                    bulmabox.alert('Message Sent', `Your mentor has been notified that you wish to discuss this lesson.`)
                })
        })
    }
    $scope.reqEndLesson = l => {
        bulmabox.confirm('Request Lesson End', "Do you wish to notify this mentor that you wish to end the lesson?", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/user/reqEndLesson?id=', l)
                .then(r => {
                    bulmabox.alert('Lesson End Requested', `Your mentor has been notified that you wish to end this lesson. <br>Please note that it is still up to them to end the lesson.`)
                })
        })
    }
    $scope.reportLesson = l => {
        bulmabox.confirm('Report Lesson', "Are you sure you wish to report this lesson to the moderator team? <br>Please note that abuse of the report feature in any context is grounds for account termination.", function (r) {
            if (!r || r == null) {
                return false;
            }
            $http.post('/usr/repLesson', l).then(r => {
                bulmabox.alert('Lesson Reported', `This lesson has been reported to the moderator team. In addition, the lesson has automatically been stopped, and a message has been sent to the lesson's mentor.`)
            })
        })
    }


    $scope.getLessons = () => {
        $http.get('/user/activeLessons')
            .then(r => {
                console.log('ACTIVE LESSONS', r)
                $scope.activeLessons = (r && r.data) || [];
            })
    }
    $scope.getLessons();

    //review stuffs
    $scope.writeReview = async function (tch) {
        //get the review first to see if it exists.
        //note that while we could just default search by user, i wanna give people the option to hide their real usernames (i.e., search by display name)
        $scope.reviewPage.msg = '';
        $scope.reviewPage.stars = 5;
        $scope.reviewPage.currStars = 5;
        $scope.reviewPage.teacher = {
            user: tch.user,
            displayName: tch.displayName || null
        }
        $scope.reviewPage.hideName = false;

        const oldReview = await $http.get(`/user/review?tch=${(tch.displayName || tch.user)}`);
        console.log('OLD REVIEW', oldReview)
        if (oldReview) {
            //old review exists, so use it
            $scope.reviewPage.msg = oldReview.data.rateText;
            $scope.reviewPage.stars = oldReview.data.rateNum;
            $scope.reviewPage.currStars = oldReview.data.rateNum;
            $scope.reviewPage.hideName = oldReview.data.hideName;
        }
        $scope.reviewPage.starsArr = [0, 1, 2, 3, 4];
        $scope.reviewPage.show = true;
        $scope.$apply();
    }
    $scope.overStars = false;
    $scope.toggleOverStars = (t, s) => {
        if (t === false) {
            return $scope.overStars = false;
        }
        $scope.overStars = s;
    };
    $scope.isActiveStar = (i, s, e) => {
        if (!$scope.overStars && $scope.overStars === false) {
            //not currently mousing over
            return i < $scope.reviewPage.stars;
        }
        return $scope.overStars !== false && $scope.overStars + 1 > i;
    }
    $scope.reviewPage = {
        show: false,
        stars: 5,
        currStars: 5,
        teacher: {
            user: 'Nothere',
            displayName: 'DoesntExist'
        },
        msg: null
    }
    $scope.submitReview = () => {
        const rvwObj = {
            // rateUsr: {
            //     user: $scope.$parent.user.user,
            //     displayName: $scope.$parent.user.displayName
            // },
            rateNum: $scope.reviewPage.stars,
            hideName: !!$scope.reviewPage.hideName,
            rateText: $scope.reviewPage.msg,
            tch: {
                user: $scope.reviewPage.teacher.user,
                displayName: $scope.reviewPage.teacher.displayName
            }
        }
        console.log('WOULD SUBMIT',rvwObj)
        $http.put('/user/review',rvwObj).then(r=>{
            $scope.reviewPage = {
                show: false,
                stars: 5,
                currStars: 5,
                teacher: {
                    user: 'Nothere',
                    displayName: 'DoesntExist'
                },
                msg: null
            }
        })
    }
})
const countDups = (arr, p) => {
    if (!arr || !arr.length) {
        return false;
    }
    const nameCount = {};
    for (let i = 0; i < arr.length; i++) {
        if (!nameCount[arr[i][p]]) {
            nameCount[arr[i][p]] = 1;
        } else {
            return nameCount[arr[i][p]];
        }
    }
    return false;
}