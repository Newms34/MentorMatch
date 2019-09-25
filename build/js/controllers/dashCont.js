app.controller('dash-cont',($scope,$http,$q,userFact)=>{
    console.log("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.updateTopics = () =>{
        // console.log('Would updoot topics here! Val we passed was',e)
        return $http.put('/user/interests',$scope.$parent.user.interests)
    }
    $scope.removeSkill = sk =>{
        $http.delete('/user/interests',sk).then(r=>{
            //do nothing 
        })
    }
})