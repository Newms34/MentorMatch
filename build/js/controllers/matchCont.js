app.controller('match-cont', function ($scope, $http, $q) {
    console.log("matcher ctrl registered")
    // $scope.searchTerm = '';
    // $scope.topics = [];
    // $scope.searchTimer = null;
    // $scope.doSearch = ()=>{
    //     if(!!$scope.searchTimer){
    //         clearTimeout($scope.searchTimer);
    //     }
    //     $scope.searchTimer = setTimeout(function(){
    //         // console.log('Searching for:',$scope.searchTerm,'http module is',$http)
    //         $http.get('/topic/search?q='+$scope.searchTerm)
    //             .then(r=>{
    //                 $scope.topics = r.data;
    //             })
    //             .catch(e=>{
    //                 console.log(e)
    //             })
    //     },500)
    // }
    // $scope.topicToAdd = '';
    // $scope.selectedItem = null;
    $http.get('/topic/topic').then(r => {
        $scope.topicObjsAll = r.data.map(q => {
            return { value: q.title.toLowerCase(), display: q.title, desc: q.desc }
        })
        $scope.topicObjs = angular.copy($scope.topicObjsAll)
    })
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
    $scope.pickedTopics = [];
    $scope.addTopicBtn = () => {
        // console.log( $scope.pickedTopics.length,$scope.topicObjs.length)
        const simpPT = $scope.pickedTopics.map(a => a.value).sort().join(''),
            simpTO = $scope.topicObjs ? $scope.topicObjs.map(b => b.value).sort().join('') : '';
        // console.log("simple data",simpPT,simpTO)
        if ($scope.topicToAdd && simpPT != simpTO) {
            return 'Click to add your selected skill!'
        } else if (simpPT != simpTO) {
            return `You need to select a skill before you can add it!`
        } else {
            return `You've added all possible skills. Create a new one if you want!`

        }
    }
    $scope.changeTopList = () => {
        // console.log('simpTops', tl, 'all', $scope.topicObjsAll)
        const tl = $scope.pickedTopics.map(s => s.value.toLowerCase())
        //remove this from our list of available topics to add
        $scope.topicObjs = $scope.topicObjsAll.filter(tf => !tl.includes(tf.value));
        $http.post('/user/topicSearch', $scope.pickedTopics).then(r => {
            $scope.availTeachs = r.data;
            // console.log('TEACHERS',$scope.availTeachs)
        })
    }
    $scope.addSearchTopic = (q) => {
        console.log('topic',q)
        if ($scope.pickedTopics.map(a => a.value.toLowerCase()).includes(q.value)) {
            // console.log('Duplicate!',q)
            $scope.topicToAdd = '';
            return bulmabox.alert(`Already Added`, `You've already added this topic!`)
        }
        const topicPush = angular.copy(q);
        topicPush.min=1;
        $scope.pickedTopics.push(topicPush);
        $scope.changeTopList();
        // $scope.filterMe('')
        // $scope.topicObjs = $scope.topicObjsAll.filter(q => !.includes(q));
        $scope.topicToAdd = '';
    }
    $scope.removeTopic = t => {
        $scope.pickedTopics = $scope.pickedTopics.filter(q => q.value != t.value);
        $scope.changeTopList();
    }
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
        }
    })
    $scope.lvls = ['None',2,3,4,5,6,7,8,9,10];
    $scope.lvls = new Array(10).fill(1).map((q,i)=>({lbl:i>1?i:'None',num:i}))
    $scope.conv = new showdown.Converter();
    console.log('TIMES', $scope.times)
    $scope.doConnect = u => {
        //set up the dialog box for connecting w/ mentor
        $scope.mentCon.user = u.user;
        $scope.mentCon.displayName = u.displayName|| null;
        $scope.mentCon.topics = $scope.pickedTopics.map(s => s.value);
        $scope.mentCon.plusMdMsg = null;
        $scope.mentCon.plusHtmlMsg = null;
        $scope.mentCon.tz = { from: null, to: null };
        $scope.mentCon.show = true;
        // $scope.$apply();
    }
    $scope.sendConnectMsg = t => {
        console.log('would send', $scope.mentCon)
        $scope.mentCon.plusHtmlMsg = $scope.conv.makeHtml($scope.mentCon.plusMdMsg);
        return false;
        $http.put('/user/connect', {
            user: t.user,
            displayName: t.displayName,
            topics: $scope.pickedTopics.map(s => s.value)
        }).then(r => {
            bulmabox.alert('Connect Request Sent', `User ${t.user} has been notified that you'd like them as a mentor!`)
        })
    };
})