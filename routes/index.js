const express = require('express');
const router = express.Router(),
    mongoose = require('mongoose');

module.exports = function(io, pp) {
    router.use('/user', require('./subroutes/users')(io, pp));
    router.use('/topic', require('./subroutes/topic')(io, pp));
    router.use('/topic', require('./subroutes/lessons')(io, pp));
    router.get('*', function(req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('index.html', { root: './views' });
    });
    router.use(function(req, res) {
        res.status(404).end();
    });
    return router;
};

//helper stuff
Array.prototype.findOne = function(p, v) {
    let i = 0;
    if (typeof p !== 'string' || !this.length) {
        return false;
    }
    for (i; i < this.length; i++) {
        if (this[i][p] && this[i][p] == v) {
            return i;
        }
    }
    return false;
};

Array.prototype.removeOne = function(n) {
    this.splice(this.indexOf(n), 1);
};