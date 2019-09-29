app.controller('dash-cont', ($scope, $http, $q, userFact) => {
    // console.log("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.updateTopics = () => {
        // console.log('Would updoot topics here! Val we passed was',e)
        return $http.put('/user/interests', $scope.$parent.user.interests)
    }
    $scope.removeSkill = sk => {
        $http.delete('/user/interests', sk).then(r => {
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
        $http.post('/user/changeOther', $scope.user).then(r => {
            //do nuffin
        })
    }
    //avy stuff
    $scope.loadFile = () => {
        $scope.loadingFile = true;
        const fr = new FileReader();
    };
    $scope.loadingFile = false;
    $scope.fileName = null;
    $scope.needsResize = 200;//the max pic width
    $scope.saveDataURI = (d) => {
        // $http.post('/user/changeAva', {
        //     img: d
        // })
        //     .then(r => {
        //         $scope.doUser(r.data);
        //     });
        $scope.user.avatar = d;
        $scope.saveGeneral();
    };

    $scope.filterMe = (query) => {
        const lowercaseQuery = query.toLowerCase();
        // console.log('picked topics map', $scope.pickedTopics.map(q => q.value))
        let tops = $scope.topicObjs.filter(topic => {
            return (topic.value.indexOf(lowercaseQuery) > -1);
        });
        // console.log('tops', tops)
        return tops;
    }
    $scope.newTopic = {
        title: null,
        desc: null,
        show: false
    }
    $http.get('/topic/topic').then(r => {
        $scope.topicObjsAll = r.data.map(q => {
            return { value: q.title.toLowerCase(), display: q.title, desc: q.desc }
        })
        $scope.topicObjs = angular.copy($scope.topicObjsAll)
    })
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
        canTeach: false,
    }
    $scope.addIntDial = (t) => {
        $scope.addInt = {
            title: t || null,
            show: true,
            lvl: 0,
            canTeach: false,
        }
    }

    $scope.saveSkills = () => {
        $http.put('/user/interests', $scope.$parent.user.interests)
            .then(r => {
                //do nothing
                $scope.addInt = {
                    title: null,
                    show: false,
                    lvl: 0,
                    canTeach: false,
                }
            })
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
        console.log('Saving projects. List is', projArr,'modProj',$scope.modProj)
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
    $scope.countDups = countDups
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