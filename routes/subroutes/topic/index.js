const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    isMod = (req, res, next) => {
        // console.log('passport', req.session.passport);
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        });
    };

const routeExp = function (io) {
    this.authbit = (req, res, next) => {
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err');
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
                if (!err && usr && !usr.isBanned && !usr.locked) {
                    usr.lastAction = Date.now();
                    usr.save((errsv, usv) => {
                        req.user = usv;
                        next();
                    });
                } else {
                    res.status(403).send('err');
                }
            });
        }
    };
    router.get('/setAllVoted',this.authbit,isMod,(req,res,next)=>{
        mongoose.model('topic').find({},(err,tps)=>{
            console.log('TOPICS',tps,'END OF TPS')
            tps.forEach(t=>{
                t.votes.status=1;
                t.creator=req.user.user;
                t.save();
            })
            res.send('done');
        })
    })
    router.get('/topic', this.authbit, (req, res, next) => {
        // console.log(req.user);
        mongoose.model('topic').find({ $or: [{ 'votes.status': 1 }, { user: req.user.user ,'votes.status':0}] }, (err, tps) => {
            // send all topics that are either in voting and by this user, OR voted in.
            res.send(tps);
        });
        // res.send('not implemented! searched for '+req.query.q);
    });
    router.get('/all',this.authbit,(req,res,next)=>{
        //ALL topics, regardless of status.
        mongoose.model('topic').find({},(err,tps)=>{
            res.send(tps);
        })
    })
    router.post('/topic', this.authbit, (req, res, next) => {
        // console.log('triggered topic add route', req.body);
        if (!req.body || !req.body.title) {
            return res.status(400).send('err');
        }
        const ciTi = new RegExp(req.body.title, 'i');
        mongoose.model('topic').find({ title: ciTi }, function (err, ae) {
            if (err || ae.length) {
                return res.status(400).send('duplicate');
            }
            mongoose.model('topic').create({
                title: req.body.title,
                desc: req.body.desc || null,
                creator: req.user.user,
                votes: {
                    votesUp: [req.user.user]//this user is automatically added as an upvote
                }
            }, function (err, resp) {
                // console.log('Done!', resp);
                res.send('done');
            });
        });
        // res.send('DONE')
    });
    router.get('/vote', this.authbit, (req, res, next) => {
        mongoose.model('topic').find({ 'votes.status': 0 }, (errv, resv) => {
            //all skills currently in voting
            res.send(resv);
        });
    });
    router.put('/vote', this.authbit, (req, res, next) => {
        if (!req.body.id || (!req.body.mode)) {
            return res.status(400).send('noData');//cannot vote without 1) topic id, and 2) voteMode (up or down == 1 or -1);
        }
        mongoose.model('topic').findOne({ _id: req.body.id, 'votes.status': 0 }, (err, tp) => {
            //topic must have the required id AND be in voting (status==0)
            // console.log('trying to vote on topic', tp);
            if (!tp || err) {
                return res.status(400).send('err');//cannot find topic!
            }
            if (req.body.mode > 0) {
                //vote UP
                tp.votes.votesDown = tp.votes.votesDown.filter(d => d != req.user.user);//first, filter out of DOWN reviews
                if (!tp.votes.votesUp.includes(req.user.user)) {
                    tp.votes.votesUp.push(req.user.user);
                } else {
                    tp.votes.votesUp = tp.votes.votesUp.filter(d => d != req.user.user);
                }
            } else {
                //vote DOWN
                tp.votes.votesUp = tp.votes.votesUp.filter(d => d != req.user.user);//first, filter out of UP reviews
                if (!tp.votes.votesDown.includes(req.user.user)) {
                    tp.votes.votesDown.push(req.user.user);
                } else {
                    tp.votes.votesDown = tp.votes.votesDown.filter(d => d != req.user.user);
                }
            }
            tp.save((errt, svt) => {
                io.emit('voteRef', {});
                io.emit('topicRef', {});
                res.send('done');
            });
        });
    });
    return router;
};
const halfDay = 1000 * 3600 * 12,
    voteExpire = 1000 * 3600 * 24 * 7,// 1 week
    halfDayFake = 1000 * 10,//for testing!
    voteExpireFake = 1000 * 30,
    voteTimer = setInterval(function () {
        //check every half day to "expire" old votes;
        const nunc = Date.now();
        mongoose.model('topic').find({ 'votes.status': 0 }, (errv, resv) => {
            // console.log('VOTES UP',resv);
            const votesToCheck = resv.filter(q => nunc - q.votes.date > voteExpire);
            // console.log('VOTES TO CHECK', (votesToCheck.length && votesToCheck) ||'None!');
            votesToCheck.forEach(v => {
                const voteUpTotal = v.votes.votesUp.length,
                    vPerc = v.votes.votesUp.length / (v.votes.votesUp.length + v.votes.votesDown.length);
                // console.log('VOTE RESULT: \nTopic',v.title,(voteUpTotal>2 && vPerc>0.6?'would':'would not'),'be voted in')
                if (voteUpTotal > 2 && vPerc > 0.6) {
                    //if we've got more than two votes (so one user cannot just simply vote their own topic up and get it to pass) and the vote percent than a little less than 2/3, set vote status to 1 (included). Otherwise set to 2 (not included)
                    v.votes.status=1;
                }else{
                    v.votes.status=2;
                }
                v.save((errvr,svvr)=>{
                    io.emit('voteRef',{});
                });
            });
        });
    }, halfDay);
module.exports = routeExp;
