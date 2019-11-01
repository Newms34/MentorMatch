app.controller('vote-cont',function($scope,$http,$state, $log){
    $scope.voteItems = [];
    $scope.regetVotes = ()=>{
        $http.get('/topic/vote').then(r=>{
            console.log('topics for voting are',r)
            $scope.voteItems = (r && r.data)||[];
        })
    }
    $scope.regetVotes();
    
    $scope.submitVote=(m,t)=>{
        //vote up or down on a particular topic
        $http.put('/topic/vote',{id:t._id,mode:m}).then(r=>{
            $scope.regetVotes();
        }); 
    }
    $scope.getScore=v=>{
        return v.votes.votesUp.length-v.votes.votesDown.length;
    }
    socket.on('voteRef',function(o){
        $scope.regetVotes();
    })
});