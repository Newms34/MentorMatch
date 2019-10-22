const express = require('express');
const router = express.Router(),
    mongoose = require('mongoose');

module.exports = function(io, pp) {
    router.use('/user', require('./subroutes/users')(io, pp));
    router.use('/topic', require('./subroutes/topic')(io, pp));
    router.use('/lesson', require('./subroutes/lessons')(io, pp));
    router.get('/reset', function(req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('reset.html', { root: './views' });
    });
    router.get('/rf', function(req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('resetFail.html', { root: './views' });
    });
    router.get('*', function(req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('index.html', { root: './views' });
    });
    router.use(function(req, res) {
        res.status(404).end();
    });
    return router;
};