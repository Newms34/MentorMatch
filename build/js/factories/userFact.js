app.factory('userFact', function($http,$log) {
    return {
        getUser: function() {
            return $http.get('/user/usrData').then(function(s) {
                $log.debug('getUser in fac says:', s);
                return s;
            });
        }
    };
});